import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { TaskCompactRow } from './TaskCompactRow';

interface CustomReorderListProps {
  tasks: Task[];
  isCustomSort: boolean;
  onReorder: (newTasks: Task[]) => void;
  onClickTask: (task: Task) => void;
  searchBarRef: React.RefObject<HTMLDivElement | null>;
}

export const CustomReorderList: React.FC<CustomReorderListProps> = ({
  tasks,
  isCustomSort,
  onReorder,
  onClickTask,
  searchBarRef,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  // Synchronous refs for event handlers
  const draggedTaskIdRef = useRef<string | null>(null);
  const targetIndexRef = useRef<number | null>(null);

  const updateDraggedTaskId = (id: string | null) => {
    draggedTaskIdRef.current = id;
    setDraggedTaskId(id);
  };

  const updateTargetIndexState = (idx: number | null) => {
    targetIndexRef.current = idx;
    setTargetIndex(idx);
  };

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const grabOffsetYRef = useRef<number>(0);
  const pointerYRef = useRef<number>(0);
  const cardRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  // Fixed snapshot of center Y positions in document coordinates at the moment drag starts
  const initialCentersRef = useRef<number[]>([]);

  // Floating card top coordinate in viewport
  const [floatingTop, setFloatingTop] = useState<number>(0);

  // Current tasks reference
  const currentTasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    currentTasksRef.current = tasks;
  }, [tasks]);

  // Viewport floating bounds for dragged card
  const getBoundaries = useCallback(() => {
    const cardHeight = cardRectRef.current?.height || 56;
    let searchBottom = 110;

    if (searchBarRef.current) {
      const rect = searchBarRef.current.getBoundingClientRect();
      searchBottom = rect.bottom + 8;
    }

    const screenBottom = window.innerHeight - cardHeight - 12;
    return {
      top: searchBottom,
      bottom: Math.max(searchBottom, screenBottom),
    };
  }, [searchBarRef]);

  // Snapshot layout slots before drag moves items
  const snapshotSlotCenters = useCallback(() => {
    if (!listContainerRef.current) return;
    const children = Array.from(listContainerRef.current.children) as HTMLElement[];
    const currentScrollY = window.scrollY;

    const centers: number[] = [];
    children.forEach((child) => {
      const rect = child.getBoundingClientRect();
      centers.push(rect.top + currentScrollY + rect.height / 2);
    });

    initialCentersRef.current = centers;
  }, []);

  // Calculate target index using fixed document slot centers
  const updateTargetIndex = useCallback(() => {
    const centers = initialCentersRef.current;
    if (!draggedTaskIdRef.current || !centers || centers.length === 0) return;

    const currentDocY = pointerYRef.current + window.scrollY;

    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < centers.length; i++) {
      const dist = Math.abs(currentDocY - centers[i]);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    if (targetIndexRef.current !== closestIndex) {
      updateTargetIndexState(closestIndex);
    }
  }, []);

  // RAF Auto-scroll loop
  const autoScrollRafRef = useRef<number | null>(null);

  const startAutoScroll = useCallback(() => {
    const loop = () => {
      if (!draggedTaskIdRef.current) return;

      const currentY = pointerYRef.current;
      const bounds = getBoundaries();
      const topScrollZone = bounds.top + 50;
      const bottomScrollZone = window.innerHeight - 80;

      let scrollSpeed = 0;

      if (currentY < topScrollZone && window.scrollY > 0) {
        const factor = Math.min(1, (topScrollZone - currentY) / 50);
        scrollSpeed = -Math.max(3, factor * 18);
      } else if (
        currentY > bottomScrollZone &&
        window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 5
      ) {
        const factor = Math.min(1, (currentY - bottomScrollZone) / 50);
        scrollSpeed = Math.max(3, factor * 18);
      }

      if (scrollSpeed !== 0) {
        window.scrollBy(0, scrollSpeed);
        updateTargetIndex();
      }

      autoScrollRafRef.current = requestAnimationFrame(loop);
    };

    autoScrollRafRef.current = requestAnimationFrame(loop);
  }, [getBoundaries, updateTargetIndex]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  // Activate drag for a task
  const startDrag = useCallback(
    (taskId: string, clientY: number, rowRect: DOMRect) => {
      snapshotSlotCenters();

      const taskIndex = currentTasksRef.current.findIndex((t) => t.id === taskId);
      cardRectRef.current = {
        left: rowRect.left,
        top: rowRect.top,
        width: rowRect.width,
        height: rowRect.height,
      };
      grabOffsetYRef.current = clientY - rowRect.top;

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {
          // ignore
        }
      }

      updateDraggedTaskId(taskId);
      updateTargetIndexState(taskIndex >= 0 ? taskIndex : 0);

      let searchBottom = 110;
      if (searchBarRef.current) {
        searchBottom = searchBarRef.current.getBoundingClientRect().bottom + 8;
      }
      const screenBottom = window.innerHeight - rowRect.height - 12;
      const initialTop = Math.max(
        searchBottom,
        Math.min(screenBottom, clientY - grabOffsetYRef.current)
      );
      setFloatingTop(initialTop);
    },
    [snapshotSlotCenters, searchBarRef]
  );

  // End drag operation
  const endDrag = useCallback(() => {
    stopAutoScroll();

    const activeId = draggedTaskIdRef.current;
    const finalTarget = targetIndexRef.current;

    if (activeId && finalTarget !== null) {
      const currentList = [...currentTasksRef.current];
      const fromIndex = currentList.findIndex((t) => t.id === activeId);

      if (fromIndex !== -1 && fromIndex !== finalTarget) {
        const [movedItem] = currentList.splice(fromIndex, 1);
        currentList.splice(finalTarget, 0, movedItem);
        onReorder(currentList);
      }
    }

    updateDraggedTaskId(null);
    updateTargetIndexState(null);
    initialCentersRef.current = [];
  }, [stopAutoScroll, onReorder]);

  // Touch listener setup: ONLY handle touches originating on [data-drag-handle="true"]
  useEffect(() => {
    const container = listContainerRef.current;
    if (!container || !isCustomSort) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      const target = e.target as HTMLElement | null;
      const isHandle = !!target?.closest('[data-drag-handle="true"]');

      // STRICT RULE: If the touch did NOT originate on the grip handle, ignore completely!
      if (!isHandle) return;

      const row = target?.closest('[data-task-id]') as HTMLElement | null;
      if (!row) return;

      const taskId = row.getAttribute('data-task-id');
      if (!taskId) return;

      const rect = row.getBoundingClientRect();
      const clientY = touch.clientY;
      pointerYRef.current = clientY;

      if (e.cancelable) e.preventDefault();
      startDrag(taskId, clientY, rect);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!draggedTaskIdRef.current) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const clientY = touch.clientY;

      if (e.cancelable) e.preventDefault();
      pointerYRef.current = clientY;

      const bounds = getBoundaries();
      const rawTop = clientY - grabOffsetYRef.current;
      const clamped = Math.max(bounds.top, Math.min(bounds.bottom, rawTop));
      setFloatingTop(clamped);

      updateTargetIndex();
    };

    const handleTouchEnd = () => {
      if (draggedTaskIdRef.current) {
        endDrag();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    isCustomSort,
    endDrag,
    getBoundaries,
    updateTargetIndex,
    startDrag,
  ]);

  // Window pointer listeners for active drag & auto scroll RAF
  useEffect(() => {
    if (!draggedTaskId) return;

    const handlePointerMove = (e: PointerEvent) => {
      pointerYRef.current = e.clientY;
      const bounds = getBoundaries();
      const rawTop = e.clientY - grabOffsetYRef.current;
      const clamped = Math.max(bounds.top, Math.min(bounds.bottom, rawTop));
      setFloatingTop(clamped);
      updateTargetIndex();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    startAutoScroll();

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      stopAutoScroll();
    };
  }, [draggedTaskId, getBoundaries, updateTargetIndex, endDrag, startAutoScroll, stopAutoScroll]);

  // Pointer event fallback for desktop mouse clicks on grip handle
  const handleItemPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    task: Task
  ) => {
    if (e.pointerType === 'touch') return; // Handled by non-passive touch listeners
    if (!isCustomSort) return;

    const isHandle = !!(e.target as HTMLElement).closest('[data-drag-handle="true"]');
    if (!isHandle) return; // STRICT RULE: Only start drag if clicking grip handle!

    const clientY = e.clientY;
    pointerYRef.current = clientY;

    const targetEl = e.currentTarget;
    const rect = targetEl.getBoundingClientRect();

    startDrag(task.id, clientY, rect);
  };

  const getDisplayItems = () => {
    if (!draggedTaskId || targetIndex === null) return tasks;

    const filtered = tasks.filter((t) => t.id !== draggedTaskId);
    const draggedItem = tasks.find((t) => t.id === draggedTaskId);

    if (!draggedItem) return tasks;

    const result = [...filtered];
    const safeIndex = Math.max(0, Math.min(targetIndex, result.length));
    result.splice(safeIndex, 0, draggedItem);
    return result;
  };

  const displayTasks = getDisplayItems();
  const draggedTask = tasks.find((t) => t.id === draggedTaskId);

  return (
    <>
      <div ref={listContainerRef} className="flex flex-col gap-2 relative select-none">
        {displayTasks.map((task) => {
          const isBeingDragged = task.id === draggedTaskId;

          if (isBeingDragged) {
            return (
              <div
                key={task.id}
                data-task-id={task.id}
                style={{ height: `${cardRectRef.current?.height || 56}px` }}
                className="w-full rounded-2xl bg-white/[0.04] border border-dashed border-white/20 transition-all duration-200"
              />
            );
          }

          return (
            <div
              key={task.id}
              data-task-id={task.id}
              onPointerDown={(e) => handleItemPointerDown(e, task)}
              className="relative rounded-2xl hover:bg-white/[0.02] transition-all duration-200"
            >
              <TaskCompactRow
                task={task}
                showDragHandle={isCustomSort}
                onClickTask={(t) => {
                  if (!draggedTaskId) {
                    onClickTask(t);
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Floating Card rendering during drag */}
      {draggedTask && cardRectRef.current && (
        <div
          style={{
            position: 'fixed',
            left: `${cardRectRef.current.left}px`,
            top: `${floatingTop}px`,
            width: `${cardRectRef.current.width}px`,
            height: `${cardRectRef.current.height}px`,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          className="scale-[1.03] shadow-2xl bg-[#1F1822] border border-white/20 rounded-2xl opacity-95 flex items-center px-4"
        >
          <div className="w-full pointer-events-none">
            <TaskCompactRow task={draggedTask} showDragHandle={true} onClickTask={() => {}} />
          </div>
        </div>
      )}
    </>
  );
};

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
  const [holdingTaskId, setHoldingTaskId] = useState<string | null>(null);
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

  // References to keep track of pointer state during drag
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const grabOffsetYRef = useRef<number>(0);
  const pointerYRef = useRef<number>(0);
  const cardRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  // Floating card position state for UI rendering
  const [floatingTop, setFloatingTop] = useState<number>(0);

  // Ref to hold current tasks during drag
  const currentTasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    currentTasksRef.current = tasks;
  }, [tasks]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Compute boundaries for the floating card
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

  // Update target index based on current pointer position
  const updateTargetIndex = useCallback(() => {
    if (!listContainerRef.current || !draggedTaskIdRef.current) return;

    const children = Array.from(listContainerRef.current.children) as HTMLElement[];
    if (children.length === 0) return;

    const currentY = pointerYRef.current;
    let closestIndex = 0;
    let minDistance = Infinity;

    children.forEach((child, idx) => {
      const rect = child.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(currentY - centerY);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    if (targetIndexRef.current !== closestIndex) {
      updateTargetIndexState(closestIndex);
    }
  }, []);

  // Pointer move handler during drag
  const handleWindowPointerMove = useCallback(
    (e: PointerEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as PointerEvent).clientY;
      pointerYRef.current = clientY;

      // Update floating card top position bounded between search bar and bottom screen
      const bounds = getBoundaries();
      const rawTop = clientY - grabOffsetYRef.current;
      const clamped = Math.max(bounds.top, Math.min(bounds.bottom, rawTop));
      setFloatingTop(clamped);

      updateTargetIndex();
    },
    [getBoundaries, updateTargetIndex]
  );

  // Auto-scroll loop when dragging near top/bottom edges of the screen
  const autoScrollRafRef = useRef<number | null>(null);

  const startAutoScroll = useCallback(() => {
    const loop = () => {
      if (!draggedTaskIdRef.current) return;

      const currentY = pointerYRef.current;
      const bounds = getBoundaries();
      const topScrollZone = bounds.top + 45;
      const bottomScrollZone = window.innerHeight - 70;

      let scrollSpeed = 0;

      if (currentY < topScrollZone && window.scrollY > 0) {
        const factor = Math.min(1, (topScrollZone - currentY) / 45);
        scrollSpeed = -Math.max(3, factor * 16);
      } else if (
        currentY > bottomScrollZone &&
        window.scrollY + window.innerHeight < document.documentElement.scrollHeight
      ) {
        const factor = Math.min(1, (currentY - bottomScrollZone) / 45);
        scrollSpeed = Math.max(3, factor * 16);
      }

      if (scrollSpeed !== 0) {
        window.scrollBy(0, scrollSpeed);
        // Recalculate target index while scrolling
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

  // Finish or cancel drag operation
  const endDrag = useCallback(() => {
    clearTimer();
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
    setHoldingTaskId(null);
  }, [clearTimer, stopAutoScroll, onReorder]);

  // Prevent default page scroll on touchmove while actively dragging
  useEffect(() => {
    if (!draggedTaskId) return;

    const preventTouch = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchmove', preventTouch, { passive: false });
    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('touchend', endDrag);

    startAutoScroll();

    return () => {
      window.removeEventListener('touchmove', preventTouch);
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      window.removeEventListener('touchend', endDrag);
      stopAutoScroll();
    };
  }, [draggedTaskId, handleWindowPointerMove, endDrag, startAutoScroll, stopAutoScroll]);

  // Start hold timer on pointer down
  const handleItemPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    task: Task,
    index: number
  ) => {
    if (!isCustomSort) return;

    const clientX = e.clientX;
    const clientY = e.clientY;
    startPosRef.current = { x: clientX, y: clientY };
    pointerYRef.current = clientY;

    const targetEl = e.currentTarget;
    const rect = targetEl.getBoundingClientRect();
    cardRectRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    grabOffsetYRef.current = clientY - rect.top;

    clearTimer();
    setHoldingTaskId(task.id);

    timerRef.current = setTimeout(() => {
      clearTimer();

      // Trigger haptic vibration if supported
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(30);
        } catch {
          // ignore
        }
      }

      updateDraggedTaskId(task.id);
      updateTargetIndexState(index);

      // Set initial clamped top
      let searchBottom = 110;
      if (searchBarRef.current) {
        searchBottom = searchBarRef.current.getBoundingClientRect().bottom + 8;
      }
      const screenBottom = window.innerHeight - rect.height - 12;
      const initialTop = Math.max(searchBottom, Math.min(screenBottom, clientY - (clientY - rect.top)));
      setFloatingTop(initialTop);
    }, 500); // 0.5 second hold
  };

  const handleItemPointerMove = (e: React.PointerEvent) => {
    if (timerRef.current && startPosRef.current) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      // Cancel hold if moved > 8px before 500ms
      if (dx > 8 || dy > 8) {
        clearTimer();
        setHoldingTaskId(null);
      }
    }
  };

  const handleItemPointerUp = () => {
    clearTimer();
    if (!draggedTaskId) {
      setHoldingTaskId(null);
    }
  };

  // Build the array of display items for rendering
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
          const isHoldingThis = task.id === holdingTaskId;

          if (isBeingDragged) {
            // Render placeholder slot in list where task will drop
            return (
              <div
                key={task.id}
                style={{ height: `${cardRectRef.current?.height || 56}px` }}
                className="w-full rounded-2xl bg-white/[0.04] border border-dashed border-white/20 transition-all duration-200"
              />
            );
          }

          return (
            <div
              key={task.id}
              onPointerDown={(e) => {
                const idx = tasks.findIndex((t) => t.id === task.id);
                handleItemPointerDown(e, task, idx);
              }}
              onPointerMove={handleItemPointerMove}
              onPointerUp={handleItemPointerUp}
              onPointerCancel={handleItemPointerUp}
              className={`relative rounded-2xl transition-all duration-200 touch-pan-y ${
                isHoldingThis
                  ? 'scale-[1.02] shadow-xl bg-[#1E1722] ring-1 ring-white/20'
                  : 'hover:bg-white/[0.02]'
              }`}
            >
              <TaskCompactRow
                task={task}
                onClickTask={(t) => {
                  if (!holdingTaskId && !draggedTaskId) {
                    onClickTask(t);
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Floating Card active during drag */}
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
            <TaskCompactRow task={draggedTask} onClickTask={() => {}} />
          </div>
        </div>
      )}
    </>
  );
};

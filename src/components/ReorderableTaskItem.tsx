import React, { useRef, useState, useEffect } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { Task } from '../types';
import { TaskCompactRow } from './TaskCompactRow';

interface ReorderableTaskItemProps {
  task: Task;
  isCustomSort: boolean;
  onClickTask: (task: Task) => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

export const ReorderableTaskItem: React.FC<ReorderableTaskItemProps> = ({
  task,
  isCustomSort,
  onClickTask,
  onDragStateChange,
}) => {
  const dragControls = useDragControls();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const pointerEventRef = useRef<React.PointerEvent | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isHoldingOrDragging = isHolding || isDragging;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const endDragState = () => {
    clearTimer();
    setIsHolding(false);
    setIsDragging(false);
    if (onDragStateChange) onDragStateChange(false);
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      endDragState();
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);

    return () => {
      clearTimer();
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isCustomSort) return;

    // Record touch/pointer start position
    startPosRef.current = { x: e.clientX, y: e.clientY };
    pointerEventRef.current = e;
    clearTimer();

    // Preserve event so dragControls can access it inside timeout
    e.persist();

    timerRef.current = setTimeout(() => {
      setIsHolding(true);
      setIsDragging(true);
      if (onDragStateChange) onDragStateChange(true);

      // Trigger haptic vibration feedback if available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {
          // ignore
        }
      }

      // Initiate drag controls
      if (pointerEventRef.current) {
        dragControls.start(pointerEventRef.current);
      }
    }, 500); // 0.5 second hold requirement
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (timerRef.current && startPosRef.current) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      // Cancel hold timer if user moves finger > 6px before 0.5 second
      if (dx > 6 || dy > 6) {
        clearTimer();
      }
    }
  };

  const handleDragEnd = () => {
    endDragState();
  };

  return (
    <Reorder.Item
      value={task}
      drag={isCustomSort ? 'y' : false}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => {
        setIsDragging(true);
        if (onDragStateChange) onDragStateChange(true);
      }}
      onDragEnd={handleDragEnd}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      style={{
        touchAction: isCustomSort && isDragging ? 'none' : 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      className={`relative rounded-2xl transition-shadow transition-transform duration-200 ${
        isHoldingOrDragging
          ? 'scale-[1.02] shadow-2xl z-50 bg-[#221B24] border border-white/10 opacity-95'
          : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDragState}
      onPointerCancel={endDragState}
    >
      <TaskCompactRow
        task={task}
        onClickTask={(t) => {
          // Only open task modal if we didn't just drag/reorder
          if (!isDragging) {
            onClickTask(t);
          }
        }}
      />
    </Reorder.Item>
  );
};

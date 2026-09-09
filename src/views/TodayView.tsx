import { useAppContext } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import type { Task } from '../types';
import { Plus, Check, Clock, Trash2, X, CalendarPlus } from 'lucide-react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { format, startOfToday, setHours } from 'date-fns';
import { useEffect, useState } from 'react';

export function TodayView() {
  const { state, dispatch } = useAppContext();

  // Use local state to override context if needed, but primarily driven by context for cross-view support
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');

  // Sync context FAB state to local state
  useEffect(() => {
    if (state.fabState.isOpen) {
      setNewTaskTitle(state.fabState.initialTitle);
      setNewTaskTime(state.fabState.initialTime);
    }
  }, [state.fabState.isOpen, state.fabState.initialTitle, state.fabState.initialTime]);

  const closeFab = () => {
    dispatch({ type: 'CLOSE_TASK_FAB' });
    setNewTaskTitle('');
    setNewTaskTime('');
  };

  const openFab = () => {
    dispatch({ type: 'OPEN_TASK_FAB', payload: {} });
  };

  const todayStr = format(startOfToday(), 'yyyy-MM-dd');

  const tasks = state.tasks.filter(t => !t.scheduledDate || t.scheduledDate === todayStr);
  const unscheduledTasks = tasks.filter(t => !t.scheduledTime);
  const scheduledTasks = tasks.filter(t => t.scheduledTime);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let timeToSave = newTaskTime;
    if (timeToSave) {
      const [h] = timeToSave.split(':');
      timeToSave = `${h.padStart(2, '0')}:00`;
    }

    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle,
      completed: false,
      createdAt: new Date().toISOString(),
      category: 'brand-accent',
      scheduledDate: timeToSave ? todayStr : undefined,
      scheduledTime: timeToSave || undefined,
    };

    dispatch({ type: 'ADD_TASK', payload: newTask });
    closeFab();
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const timeSlot = over.id; // e.g. "08:00" or gap string like "gap-08:00"

    // Ignore gaps for dropping
    if (timeSlot.startsWith('gap-')) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { ...task, scheduledDate: todayStr, scheduledTime: timeSlot }
      });
    }
  };

  const timelineHours = Array.from({ length: 18 }, (_, i) => {
    const d = setHours(new Date(), i + 6);
    return format(d, 'HH:00'); // "06:00" to "23:00"
  });

  // Calculate gaps
  const timelineElements = [];
  let currentGapStart: string | null = null;
  let gapLength = 0;

  for (let i = 0; i < timelineHours.length; i++) {
    const hour = timelineHours[i];
    const hourPrefix = hour.split(':')[0];
    const slotTasks = scheduledTasks.filter(t => t.scheduledTime?.startsWith(hourPrefix));

    if (slotTasks.length === 0) {
      if (currentGapStart === null) {
        currentGapStart = hour;
      }
      gapLength++;
    } else {
      // If we hit a populated slot, check if we just ended a gap > 1 hour
      if (currentGapStart && gapLength > 1) {
        timelineElements.push(
          <TimelineGap key={`gap-${currentGapStart}`} gapLength={gapLength} startTime={currentGapStart} />
        );
      } else if (currentGapStart && gapLength === 1) {
        // Just one empty hour, render it normally
        const hourFormatted = format(parseTime(currentGapStart), 'h a');
        timelineElements.push(<TimeSlot key={currentGapStart} timeId={currentGapStart} label={hourFormatted} tasks={[]} />);
      }

      // Reset gap tracking
      currentGapStart = null;
      gapLength = 0;

      // Render the populated slot
      const hourFormatted = format(parseTime(hour), 'h a');
      timelineElements.push(<TimeSlot key={hour} timeId={hour} label={hourFormatted} tasks={slotTasks} />);
    }
  }

  // Handle trailing gap at the end of the day
  if (currentGapStart && gapLength > 1) {
    timelineElements.push(
      <TimelineGap key={`gap-${currentGapStart}`} gapLength={gapLength} startTime={currentGapStart} />
    );
  } else if (currentGapStart && gapLength === 1) {
    const hourFormatted = format(parseTime(currentGapStart), 'h a');
    timelineElements.push(<TimeSlot key={currentGapStart} timeId={currentGapStart} label={hourFormatted} tasks={[]} />);
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full max-w-6xl mx-auto pb-24">
        <h1 className="text-4xl text-white mb-8 border-b-4 border-white pb-4 inline-block pr-12">Today</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left Column: To-Do */}
          <div>
            <div className="bg-brand-card border-4 border-white shadow-brutal p-6 h-full">
              <h2 className="text-xl bg-white text-brand-bg inline-block px-3 py-1 mb-6 border-2 border-brand-bg shadow-[2px_2px_0px_0px_#000]">To-Do</h2>

              <div className="space-y-4">
                {unscheduledTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
                {unscheduledTasks.length === 0 && (
                  <div className="text-center py-12 text-white border-4 border-dashed border-white bg-brand-bg font-bold tracking-widest uppercase">
                    No tasks left
                    <br />
                    <span className="text-xs opacity-70">Slam the + button.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Timeline */}
          <div>
            <div className="bg-brand-secondary border-4 border-white shadow-brutal p-6 h-full pl-2">
              <h2 className="text-xl bg-white text-brand-bg inline-flex items-center gap-2 px-3 py-1 mb-8 border-2 border-brand-bg shadow-[2px_2px_0px_0px_#000] ml-4">
                <Clock className="w-5 h-5 stroke-[3]" />
                Timeline
              </h2>

              <div className="relative border-l-4 border-white ml-16 space-y-0 pb-4">
                {timelineElements}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Button Overlay */}
      {state.fabState.isOpen && (
        <div className="fixed inset-0 bg-brand-bg/90 z-40 flex flex-col justify-end p-4 pb-32" onClick={closeFab}>
          <div
            className="bg-brand-card border-4 border-white p-8 w-full max-w-md mx-auto shadow-brutal transform transition-transform translate-x-[-4px] translate-y-[-4px]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8 border-b-4 border-white pb-4">
              <h3 className="text-2xl text-white">ADD TASK</h3>
              <button onClick={closeFab} className="text-white hover:text-brand-accent transition-colors">
                <X className="w-8 h-8 stroke-[3]" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-6">
              <div>
                <label className="block font-black text-white uppercase tracking-wider mb-2">Title</label>
                <input
                  autoFocus
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="DO THE THING..."
                  className="brutal-input w-full"
                />
              </div>

              <div>
                <label className="block font-black text-white uppercase tracking-wider mb-2">Time</label>
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="brutal-input w-full [color-scheme:dark]"
                />
              </div>

              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="brutal-btn-accent w-full disabled:opacity-50 disabled:pointer-events-none mt-4"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={state.fabState.isOpen ? closeFab : openFab}
        className={`fixed bottom-24 md:bottom-12 right-6 md:right-12 z-50 w-16 h-16 bg-brand-accent text-brand-bg border-4 border-white shadow-brutal flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all ${state.fabState.isOpen ? 'rotate-45' : ''}`}
      >
        <Plus className="w-8 h-8 stroke-[4]" />
      </button>

    </DndContext>
  );
}

function parseTime(timeStr: string) {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d;
}

function TaskItem({ task }: { task: Task }) {
  const { dispatch } = useAppContext();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  const toggleComplete = () => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: { ...task, completed: !task.completed }
    });
  };

  const removeTask = () => {
    dispatch({ type: 'DELETE_TASK', payload: task.id });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 bg-brand-bg border-4 border-white group transition-all ${
        isDragging ? 'opacity-90 shadow-brutal-accent translate-x-[-2px] translate-y-[-2px]' : 'shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]'
      } ${task.completed ? 'opacity-60 bg-brand-bg/50' : ''}`}
    >
      <button
        onClick={toggleComplete}
        className={`w-8 h-8 flex-shrink-0 border-4 flex items-center justify-center transition-colors ${
          task.completed
            ? 'bg-brand-accent border-brand-accent text-brand-bg'
            : 'bg-white border-white hover:bg-brand-accent hover:border-brand-accent text-transparent hover:text-brand-bg'
        }`}
      >
        <Check className="w-6 h-6 stroke-[4]" />
      </button>

      <div
        {...attributes}
        {...listeners}
        className="flex-1 cursor-grab active:cursor-grabbing select-none"
      >
        <p className={`text-white font-bold text-lg leading-tight ${task.completed ? 'line-through opacity-70' : ''}`}>
          {task.title}
        </p>
      </div>

      <button
        onClick={removeTask}
        className="opacity-0 group-hover:opacity-100 p-2 text-white hover:bg-white hover:text-brand-bg border-2 border-transparent hover:border-brand-bg transition-all"
      >
        <Trash2 className="w-5 h-5 stroke-[3]" />
      </button>
    </div>
  );
}

function TimeSlot({ timeId, label, tasks }: { timeId: string, label: string, tasks: Task[] }) {
  const { isOver, setNodeRef } = useDroppable({
    id: timeId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[5rem] pl-8 pr-4 py-3 border-b-4 border-white transition-colors ${
        isOver ? 'bg-white/20' : ''
      }`}
    >
      <div className="absolute -left-[4.5rem] top-3 text-xs font-black text-white bg-brand-bg border-2 border-white px-1 py-0.5 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] w-[3.5rem] text-center">
        {label}
      </div>

      <div className="absolute -left-[10px] top-4 w-4 h-4 bg-brand-accent border-4 border-white" />

      <div className="space-y-4">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function TimelineGap({ gapLength, startTime }: { gapLength: number, startTime: string }) {
  const { dispatch } = useAppContext();

  const handlePlanSlot = () => {
    dispatch({
      type: 'OPEN_TASK_FAB',
      payload: { initialTime: startTime }
    });
  };

  return (
    <div className="relative min-h-[5rem] pl-8 pr-4 py-4 border-b-4 border-white/50 border-dashed flex items-center justify-center group bg-brand-bg/20">
      <div className="absolute -left-[4.5rem] top-1/2 -translate-y-1/2 text-[10px] font-black text-white/50 w-[3.5rem] text-center uppercase tracking-widest">
        {gapLength}H GAP
      </div>

      <button
        onClick={handlePlanSlot}
        className="opacity-0 group-hover:opacity-100 flex items-center gap-2 bg-brand-accent text-brand-bg border-4 border-brand-bg font-black uppercase text-sm px-4 py-2 hover:bg-white transition-all shadow-[4px_4px_0px_0px_#000]"
      >
        <CalendarPlus className="w-5 h-5 stroke-[3]" />
        Plan this slot
      </button>
    </div>
  );
}

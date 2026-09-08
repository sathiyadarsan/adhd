import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import type { Task } from '../types';
import { Plus, Check, Clock, Trash2, X } from 'lucide-react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { format, startOfToday, setHours } from 'date-fns';

export function TodayView() {
  const { state, dispatch } = useAppContext();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState(''); // e.g. "08:00"

  const todayStr = format(startOfToday(), 'yyyy-MM-dd');

  // Filter for unscheduled tasks or tasks scheduled for today
  const tasks = state.tasks.filter(t => !t.scheduledDate || t.scheduledDate === todayStr);
  const unscheduledTasks = tasks.filter(t => !t.scheduledTime);
  const scheduledTasks = tasks.filter(t => t.scheduledTime);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let timeToSave = newTaskTime;
    // ensure time is in "HH:00" format if provided, for simplicity in the grid
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
    setNewTaskTitle('');
    setNewTaskTime('');
    setIsFabOpen(false);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    // active.id is task id
    // over.id is timeslot (e.g., "08:00")

    const taskId = active.id;
    const timeSlot = over.id;

    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { ...task, scheduledDate: todayStr, scheduledTime: timeSlot }
      });
    }
  };

  // Generate timeline hours: 6 AM to 11 PM
  const timelineHours = Array.from({ length: 18 }, (_, i) => {
    const d = setHours(new Date(), i + 6);
    return format(d, 'HH:00');
  });

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full max-w-6xl mx-auto pb-24">
        <h1 className="text-3xl font-serif font-bold text-slate-100 mb-6">Today</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column: To-Do */}
          <div>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-6">
              <h2 className="text-sm font-bold text-slate-500 tracking-wider mb-4 uppercase">To-Do</h2>

              <div className="space-y-3">
                {unscheduledTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
                {unscheduledTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                    No unscheduled tasks
                    <br />
                    <span className="text-xs">Use the + button to add one.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Timeline */}
          <div>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-6 pl-2">
              <h2 className="text-sm font-bold text-slate-500 tracking-wider mb-6 uppercase flex items-center gap-2 pl-4">
                <Clock className="w-4 h-4" />
                Timeline
              </h2>

              <div className="relative border-l-2 border-slate-800 ml-16 space-y-0">
                {timelineHours.map(hour => {
                  const hourFormatted = format(parseTime(hour), 'h a');
                  const slotTasks = scheduledTasks.filter(t => t.scheduledTime?.startsWith(hour.split(':')[0]));

                  return (
                    <TimeSlot key={hour} timeId={hour} label={hourFormatted} tasks={slotTasks} />
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Button (FAB) and Overlay */}
      {isFabOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-40 flex flex-col justify-end p-4 pb-24" onClick={() => setIsFabOpen(false)}>
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl transform transition-transform"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-100">Add New Task</h3>
              <button onClick={() => setIsFabOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Title</label>
                <input
                  autoFocus
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="E.g., Review PRs..."
                  className="w-full bg-slate-950 text-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-600 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Time (Optional)</label>
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 border border-slate-800 [color-scheme:dark]"
                />
              </div>

              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="w-full bg-amber-500 text-slate-900 font-bold rounded-xl px-4 py-3 hover:bg-amber-600 transition-colors shadow-lg disabled:opacity-50"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsFabOpen(!isFabOpen)}
        className={`fixed bottom-20 md:bottom-12 right-6 md:right-12 z-50 w-14 h-14 bg-amber-500 text-slate-900 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all ${isFabOpen ? 'rotate-45' : ''}`}
      >
        <Plus className="w-6 h-6" />
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
      className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 group ${
        isDragging ? 'opacity-75 shadow-2xl ring-2 ring-amber-500' : 'hover:border-slate-600'
      } ${task.completed ? 'opacity-50' : ''}`}
    >
      <button
        onClick={toggleComplete}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.completed
            ? 'bg-amber-500 border-amber-500 text-slate-900'
            : 'border-slate-600 hover:border-amber-500'
        }`}
      >
        {task.completed && <Check className="w-4 h-4" />}
      </button>

      <div
        {...attributes}
        {...listeners}
        className="flex-1 cursor-grab active:cursor-grabbing select-none"
      >
        <p className={`text-slate-200 ${task.completed ? 'line-through text-slate-500' : ''}`}>
          {task.title}
        </p>
      </div>

      <button
        onClick={removeTask}
        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
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
      className={`relative min-h-[4.5rem] pl-6 pr-4 py-2 border-b border-slate-800 transition-colors ${
        isOver ? 'bg-slate-800/50' : ''
      }`}
    >
      <div className="absolute -left-16 top-3 text-xs font-bold text-slate-500 w-12 text-right">
        {label}
      </div>

      {/* Connector dot */}
      <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-slate-700" />

      <div className="space-y-2">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

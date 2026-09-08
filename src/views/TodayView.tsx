import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useTasks } from '../hooks/useTasks';
import { getTodayDateString } from '../utils/helpers';
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';
import { Plus, Check, Clock, Trash2, GripVertical } from 'lucide-react';
import type { Task } from '../types';
import { cn } from '../utils/helpers';

const TIMELINE_HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

// --- Components ---

function DraggableTask({ task, updateTask, deleteTask }: { task: Task; updateTask: (t: Task) => void; deleteTask: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-white border rounded-xl shadow-sm group",
        isDragging ? "opacity-50 border-indigo-500 z-50" : "border-gray-100 hover:border-gray-200",
        task.completed && "opacity-60 bg-gray-50"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500">
        <GripVertical size={16} />
      </div>
      <button
        onClick={() => updateTask({ ...task, completed: !task.completed })}
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center border transition-colors",
          task.completed ? "bg-indigo-500 border-indigo-500 text-white" : "border-gray-300 text-transparent"
        )}
      >
        <Check size={12} strokeWidth={3} />
      </button>
      <div className="flex-1 min-w-0 flex items-center justify-between">
        <p className={cn("text-sm font-medium truncate", task.completed ? "text-gray-400 line-through" : "text-gray-900")}>
          {task.title}
        </p>
        {task.durationMinutes && (
          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
            {task.durationMinutes}m
          </span>
        )}
      </div>
      <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function TimelineSlot({ hour, tasks, updateTask }: { hour: number; tasks: Task[]; updateTask: (t: Task) => void }) {
  const timeStr = `${hour.toString().padStart(2, '0')}:00`;
  const slotId = `slot-${hour}`;
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { hour, timeStr },
  });

  return (
    <div ref={setNodeRef} className="flex gap-4 relative">
      <div className="w-12 text-right">
        <span className="text-xs font-medium text-gray-400">
          {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
        </span>
      </div>
      <div className={cn(
        "flex-1 min-h-[4rem] border-l-2 border-dashed pl-4 pb-2",
        isOver ? "border-indigo-500 bg-indigo-50/50 rounded-r-xl" : "border-gray-200"
      )}>
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="bg-white border border-gray-100 p-2 rounded-lg shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-2">
                 <button
                  onClick={() => updateTask({ ...task, completed: !task.completed })}
                  className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center border transition-colors",
                    task.completed ? "bg-indigo-500 border-indigo-500 text-white" : "border-gray-300 text-transparent"
                  )}
                >
                  <Check size={10} strokeWidth={3} />
                </button>
                <span className={cn("text-sm", task.completed ? "text-gray-400 line-through" : "text-gray-800")}>{task.title}</span>
              </div>
              <button
                onClick={() => updateTask({ ...task, scheduledTime: undefined })}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main View ---

export function TodayView() {
  const [searchParams] = useSearchParams();
  const selectedDate = searchParams.get('date') || getTodayDateString();
  const { tasks, addTask, updateTask, deleteTask, scheduleTask } = useTasks();
  const [newTask, setNewTask] = useState('');

  const displayDate = selectedDate === getTodayDateString()
    ? 'Today'
    : format(parseISO(selectedDate), 'MMM d, yyyy');

  const todaysTasks = tasks.filter(t => t.scheduledDate === selectedDate || (!t.scheduledDate && selectedDate === getTodayDateString()));
  const unscheduledTasks = todaysTasks.filter(t => !t.scheduledTime);

  const [duration, setDuration] = useState<string>('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    addTask({
      id: crypto.randomUUID(),
      title: newTask.trim(),
      completed: false,
      durationMinutes: duration ? parseInt(duration, 10) : undefined,
      scheduledDate: selectedDate,
      createdAt: new Date().toISOString(),
    });
    setNewTask('');
    setDuration('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as Task;
    const timeStr = over.data.current?.timeStr as string;

    if (task && timeStr) {
      scheduleTask(task.id, selectedDate, timeStr);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{displayDate}</h1>
        </header>

        <div className="flex-1 overflow-y-auto pb-4 space-y-8 no-scrollbar pr-2">

          {/* TO-DO LIST */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              <Check size={16} />
              To-Do
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What needs to be done?"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!newTask.trim()}
                  className="bg-indigo-600 text-white p-2.5 rounded-xl disabled:opacity-50 transition-opacity shadow-sm"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Duration (mins, optional)"
                  className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all shadow-sm"
                />
              </div>
            </form>

            <div className="space-y-2 min-h-[4rem]">
              {unscheduledTasks.map(task => (
                <DraggableTask key={task.id} task={task} updateTask={updateTask} deleteTask={deleteTask} />
              ))}
              {unscheduledTasks.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-4 border-2 border-dashed border-gray-100 rounded-xl">
                  All tasks scheduled!
                </div>
              )}
            </div>
          </section>

          {/* TIMELINE */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
              <Clock size={16} />
              Timeline
            </div>

            <div className="relative">
              {/* Current Time Indicator (only on "Today") */}
              {selectedDate === getTodayDateString() && (
                <div
                  className="absolute left-14 right-0 border-t-2 border-red-400 z-10 flex items-center pointer-events-none"
                  style={{
                    top: (() => {
                      const now = new Date();
                      const h = now.getHours();
                      const m = now.getMinutes();
                      if (h < 6 || h > 23) return '-10px'; // hide if outside timeline
                      const slotsFromTop = h - 6;
                      const heightPerSlot = 64; // 4rem roughly
                      return `${slotsFromTop * heightPerSlot + (m/60)*heightPerSlot}px`;
                    })()
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                </div>
              )}

              {TIMELINE_HOURS.map(hour => {
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                const slotTasks = todaysTasks.filter(t => t.scheduledTime === timeStr);
                return (
                  <TimelineSlot
                    key={hour}
                    hour={hour}

                    tasks={slotTasks}
                    updateTask={updateTask}
                  />
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </DndContext>
  );
}

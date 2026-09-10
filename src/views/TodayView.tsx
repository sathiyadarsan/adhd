import { useAppContext } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import type { Task } from '../types';
import { Plus, Check, Clock, Trash2, X, CalendarPlus, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { format, setHours, addDays, subDays, isSameDay, parseISO } from 'date-fns';
import { useEffect, useState, useRef } from 'react';

export function TodayView() {
  const { state, dispatch } = useAppContext();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');

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

  const selectedDateObj = parseISO(state.selectedDate);
  const todayObj = new Date();

  // Tasks for the selected day
  const dailyTasks = state.tasks.filter(t => !t.scheduledDate || t.scheduledDate === state.selectedDate);
  const scheduledTasks = dailyTasks.filter(t => t.scheduledTime);

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
      scheduledDate: state.selectedDate,
      scheduledTime: timeToSave || undefined,
    };

    dispatch({ type: 'ADD_TASK', payload: newTask });
    closeFab();
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const timeSlot = over.id;

    if (timeSlot.startsWith('gap-')) return;

    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { ...task, scheduledDate: state.selectedDate, scheduledTime: timeSlot }
      });
    }
  };

  const timelineHours = Array.from({ length: 18 }, (_, i) => {
    const d = setHours(new Date(), i + 6);
    return format(d, 'HH:00');
  });

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
      if (currentGapStart && gapLength > 1) {
        timelineElements.push(
          <TimelineGap key={`gap-${currentGapStart}`} gapLength={gapLength} startTime={currentGapStart} />
        );
      } else if (currentGapStart && gapLength === 1) {
        const hourFormatted = format(parseTime(currentGapStart), 'h a');
        timelineElements.push(<TimeSlot key={currentGapStart} timeId={currentGapStart} label={hourFormatted} tasks={[]} />);
      }

      currentGapStart = null;
      gapLength = 0;

      const hourFormatted = format(parseTime(hour), 'h a');
      timelineElements.push(<TimeSlot key={hour} timeId={hour} label={hourFormatted} tasks={slotTasks} />);
    }
  }

  if (currentGapStart && gapLength > 1) {
    timelineElements.push(
      <TimelineGap key={`gap-${currentGapStart}`} gapLength={gapLength} startTime={currentGapStart} />
    );
  } else if (currentGapStart && gapLength === 1) {
    const hourFormatted = format(parseTime(currentGapStart), 'h a');
    timelineElements.push(<TimeSlot key={currentGapStart} timeId={currentGapStart} label={hourFormatted} tasks={[]} />);
  }

  const stripDays = Array.from({ length: 15 }, (_, i) => subDays(addDays(selectedDateObj, i), 7));

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full max-w-6xl mx-auto pb-24">

        {/* Day Strip Header */}
        <div className="mb-6 overflow-x-auto pb-2 no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {stripDays.map(day => {
              const isSelected = isSameDay(day, selectedDateObj);
              const isCurrentToday = isSameDay(day, todayObj);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => dispatch({ type: 'SET_SELECTED_DATE', payload: format(day, 'yyyy-MM-dd') })}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[4rem] transition-colors transition-transform duration-300 ease-in-out border ${
                    isSelected
                      ? 'bg-theme-card/70 border-theme-accent/50 text-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.25)]'
                      : isCurrentToday
                        ? 'bg-theme-card/40 border-theme-border/50 text-slate-200 hover:bg-theme-border/50'
                        : 'bg-theme-card/20 border-transparent text-slate-400 hover:bg-theme-card/60 hover:text-slate-200 hover:border-theme-border/30'
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wider">{format(day, 'EEE')}</span>
                  <span className="text-lg font-semibold">{format(day, 'd')}</span>
                  {isCurrentToday && !isSelected && <div className="mt-0.5 w-1 h-1 rounded-full bg-theme-accent" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column: To-Do */}
          <div>
            <div className="bg-theme-card/70 backdrop-blur-md border border-theme-border/50 rounded-2xl p-6 h-full shadow-[0_4px_20px_-2px_rgba(0,0,0,0.25)]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-100">To-Do</h2>
                <span className="text-sm font-medium text-slate-400">{format(selectedDateObj, 'MMM d, yyyy')}</span>
              </div>

              <div className="space-y-3">
                {dailyTasks.map(task => (
                  <TaskItem key={task.id} task={task} showTimeLabel={true} />
                ))}
                {dailyTasks.length === 0 && (
                  <div className="text-center py-12 text-slate-500 border border-dashed border-theme-border/50 rounded-2xl bg-theme-card/30">
                    No tasks for this day
                    <br />
                    <span className="text-sm opacity-70">Tap the + button to add one.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Timeline */}
          <div>
            <div className="bg-theme-card/70 backdrop-blur-md border border-theme-border/50 rounded-2xl p-6 h-full pl-2 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.25)]">
              <h2 className="text-xl font-semibold text-slate-100 mb-6 flex items-center gap-2 pl-4">
                <Clock className="w-5 h-5 text-theme-accent" />
                Timeline
              </h2>

              <div className="relative border-l border-theme-border/50 ml-16 space-y-0 pb-4">
                {timelineElements}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Button Overlay */}
      {state.fabState.isOpen && (
        <div className="fixed inset-0 bg-theme-bg/80 backdrop-blur-sm z-40 flex flex-col justify-end p-4 pb-32 transition-colors transition-transform duration-300 ease-in-out" onClick={closeFab}>
          <div
            className="bg-theme-card/90 backdrop-blur-md border border-theme-border/50 rounded-2xl p-6 w-full max-w-md mx-auto shadow-[0_4px_20px_-2px_rgba(0,0,0,0.25)] transition-colors transition-transform duration-300 ease-in-out"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-slate-100">Add Task</h3>
              <button onClick={closeFab} className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-theme-border/50 transition-colors transition-transform duration-300 ease-in-out">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                <input
                  autoFocus
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g., Review PRs..."
                  className="w-full pl-4 pr-4 py-3 bg-theme-bg/50 border border-theme-border/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-theme-accent/50 focus:ring-1 focus:ring-theme-accent/50 transition-colors transition-transform duration-300 ease-in-out"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Time (Optional)</label>
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-bg/50 border border-theme-border/50 rounded-xl text-slate-200 focus:outline-none focus:border-theme-accent/50 focus:ring-1 focus:ring-theme-accent/50 transition-colors transition-transform duration-300 ease-in-out [color-scheme:dark]"
                />
              </div>

              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="w-full bg-theme-accent text-white font-medium rounded-full px-4 py-3 hover:bg-theme-accent/90 transition-colors transition-transform duration-300 ease-in-out shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-95"
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
        className={`fixed bottom-20 md:bottom-12 right-6 md:right-12 z-50 w-14 h-14 bg-theme-accent text-white rounded-full shadow-[0_4px_20px_-2px_rgba(0,0,0,0.25)] flex items-center justify-center hover:bg-theme-accent/90 hover:scale-105 active:scale-95 transition-colors transition-transform duration-300 ease-in-out ${state.fabState.isOpen ? 'rotate-45' : ''}`}
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

function TaskItem({ task, showTimeLabel = false }: { task: Task, showTimeLabel?: boolean }) {
  const { dispatch } = useAppContext();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const [isTimerOpen, setIsTimerOpen] = useState(false);

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

  const formattedTime = task.scheduledTime
    ? format(parseTime(task.scheduledTime), 'h:mm a')
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col p-3 rounded-2xl border transition-colors transition-transform duration-300 ease-in-out ${
        isDragging
          ? 'bg-theme-card/70 backdrop-blur-md border-theme-accent/50 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.25)] scale-[1.02]'
          : 'bg-theme-card/70 backdrop-blur-md border-theme-border/50 hover:border-theme-accent/40 shadow-sm'
      } ${task.completed ? 'opacity-60 bg-theme-card/40' : ''}`}
    >
      <div className="flex items-center gap-3">
        <label className="relative flex items-center justify-center cursor-pointer w-6 h-6 shrink-0">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={toggleComplete}
            className="peer appearance-none w-0 h-0 opacity-0 absolute"
          />
          <div className="w-[22px] h-[22px] rounded-full border border-theme-border/80 flex items-center justify-center transition-colors transition-transform duration-300 ease-in-out peer-checked:bg-theme-secondary peer-checked:border-theme-secondary peer-checked:shadow-[0_0_8px_0_rgba(45,212,191,0.4)] peer-hover:border-theme-accent">
            <Check className="w-3.5 h-3.5 text-white opacity-0 transition-opacity duration-300 ease-in-out peer-checked:opacity-100" />
          </div>
        </label>

        <div
          {...attributes}
          {...listeners}
          className="flex-1 cursor-grab active:cursor-grabbing select-none py-1"
        >
          <div className={`text-slate-200 font-medium leading-snug ${task.completed ? 'line-through text-slate-500' : ''}`}>
            {showTimeLabel && formattedTime && (
              <span className="text-theme-accent font-semibold mr-2 text-xs">{formattedTime} &middot;</span>
            )}
            {task.title}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity duration-300 ease-in-out">
          <button
            onClick={() => setIsTimerOpen(!isTimerOpen)}
            className={`p-1.5 rounded-full transition-colors transition-transform duration-300 ease-in-out ${
              isTimerOpen
                ? 'bg-theme-accent/20 text-theme-accent'
                : 'text-slate-400 hover:bg-theme-border hover:text-slate-200 active:scale-95'
            }`}
            title="Focus Timer"
          >
            <Timer className="w-4 h-4" />
          </button>

          <button
            onClick={removeTask}
            className="p-1.5 rounded-full text-slate-400 hover:bg-theme-border hover:text-red-400 transition-colors transition-transform duration-300 ease-in-out active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isTimerOpen && (
        <div className="mt-3 pt-3 border-t border-theme-border/50">
          <TaskTimer defaultMinutes={25} />
        </div>
      )}
    </div>
  );
}

function TaskTimer({ defaultMinutes }: { defaultMinutes: number }) {
  const [minutesInput, setMinutesInput] = useState(defaultMinutes.toString());
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const toggleTimer = () => {
    if (!isRunning && timeLeft === 0) {
      const parsed = parseInt(minutesInput) || defaultMinutes;
      setTimeLeft(parsed * 60);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const parsed = parseInt(minutesInput) || defaultMinutes;
    setTimeLeft(parsed * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleInputBlur = () => {
    if (isRunning) return;
    const parsed = parseInt(minutesInput);
    if (!isNaN(parsed) && parsed > 0) {
      setTimeLeft(parsed * 60);
    } else {
      setMinutesInput(defaultMinutes.toString());
      setTimeLeft(defaultMinutes * 60);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-theme-bg/30 rounded-xl p-2 border border-theme-border/30">
      <div className="flex items-center gap-1.5 bg-theme-card/50 rounded-lg px-2 py-1 border border-theme-border/30">
        <input
          type="number"
          value={minutesInput}
          onChange={(e) => setMinutesInput(e.target.value)}
          onBlur={handleInputBlur}
          disabled={isRunning}
          className="w-8 bg-transparent text-slate-200 font-medium text-center outline-none disabled:opacity-50 text-sm"
          min="1"
          max="120"
        />
        <span className="text-slate-500 font-medium text-[10px] uppercase">Min</span>
      </div>

      <div className="flex-1 text-center font-semibold text-lg text-slate-100 tabular-nums tracking-wide">
        {formatTime(timeLeft)}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTimer}
          className={`p-1.5 rounded-full transition-colors transition-transform duration-300 ease-in-out active:scale-95 ${
            isRunning
              ? 'bg-theme-border text-slate-200 hover:bg-theme-border/80'
              : 'bg-theme-accent text-white hover:bg-theme-accent/90'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={resetTimer}
          className="text-slate-400 p-1.5 hover:bg-theme-card hover:text-slate-200 rounded-full transition-colors transition-transform duration-300 ease-in-out active:scale-95"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
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
      className={`relative min-h-[4rem] pl-6 pr-2 py-2 border-b border-theme-border/50 transition-colors ${
        isOver ? 'bg-theme-border/20' : ''
      }`}
    >
      <div className="absolute -left-14 top-3 text-xs font-medium text-slate-500 w-10 text-right">
        {label}
      </div>

      <div className="absolute -left-[5px] top-4 w-2.5 h-2.5 rounded-full bg-theme-card border-2 border-theme-border" />

      <div className="space-y-2">
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
    <div className="relative min-h-[4rem] pl-6 pr-2 py-3 border-b border-theme-border/50 border-dashed flex items-center justify-center group bg-theme-bg/20">
      <div className="absolute -left-14 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-500 w-10 text-right uppercase tracking-wider">
        {gapLength}H GAP
      </div>

      <button
        onClick={handlePlanSlot}
        className="opacity-0 group-hover:opacity-100 flex items-center gap-2 bg-theme-card/70 backdrop-blur-md text-slate-300 border border-theme-border/50 rounded-full text-xs font-medium px-4 py-2 hover:bg-theme-border hover:text-slate-100 transition-colors transition-transform duration-300 ease-in-out shadow-[0_4px_20px_-2px_rgba(0,0,0,0.25)] active:scale-95"
      >
        <CalendarPlus className="w-3.5 h-3.5" />
        Plan this slot
      </button>
    </div>
  );
}

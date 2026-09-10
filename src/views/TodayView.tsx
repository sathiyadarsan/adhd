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
      scheduledDate: state.selectedDate, // attach to currently selected date
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

  // Scrollable Day Strip (approx 2 weeks centered around selected date)
  const stripDays = Array.from({ length: 15 }, (_, i) => subDays(addDays(selectedDateObj, i), 7));

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full max-w-6xl mx-auto pb-24">

        {/* Day Strip Header */}
        <div className="mb-8 overflow-x-auto pb-4 no-scrollbar">
          <div className="flex gap-4 min-w-max">
            {stripDays.map(day => {
              const isSelected = isSameDay(day, selectedDateObj);
              const isCurrentToday = isSameDay(day, todayObj);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => dispatch({ type: 'SET_SELECTED_DATE', payload: format(day, 'yyyy-MM-dd') })}
                  className={`flex flex-col items-center justify-center p-3 border-4 min-w-[5rem] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] ${
                    isSelected
                      ? 'bg-brand-accent border-brand-bg text-brand-bg shadow-[4px_4px_0px_0px_#000] scale-110 z-10'
                      : isCurrentToday
                        ? 'bg-white border-brand-bg text-brand-bg shadow-brutal-sm'
                        : 'bg-brand-bg border-white text-white shadow-brutal-sm'
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-widest">{format(day, 'EEE')}</span>
                  <span className="text-2xl font-black">{format(day, 'd')}</span>
                  {isCurrentToday && !isSelected && <div className="mt-1 w-2 h-2 bg-brand-accent border border-brand-bg" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left Column: To-Do (Now shows ALL tasks for the day) */}
          <div>
            <div className="bg-brand-card border-4 border-white shadow-brutal p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl bg-white text-brand-bg inline-block px-3 py-1 border-2 border-brand-bg shadow-[2px_2px_0px_0px_#000]">To-Do</h2>
                <span className="text-white font-black uppercase">{format(selectedDateObj, 'MMM d, yyyy')}</span>
              </div>

              <div className="space-y-4">
                {dailyTasks.map(task => (
                  <TaskItem key={task.id} task={task} showTimeLabel={true} />
                ))}
                {dailyTasks.length === 0 && (
                  <div className="text-center py-12 text-white border-4 border-dashed border-white bg-brand-bg font-bold tracking-widest uppercase">
                    No tasks for this day
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
              <h3 className="text-2xl text-white font-black uppercase">ADD TASK</h3>
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
      className={`flex flex-col p-4 bg-brand-bg border-4 border-white group transition-all ${
        isDragging ? 'opacity-90 shadow-brutal-accent translate-x-[-2px] translate-y-[-2px]' : 'shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]'
      } ${task.completed ? 'opacity-60 bg-brand-bg/50' : ''}`}
    >
      <div className="flex items-center gap-4">
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
          <div className={`text-white font-bold text-lg leading-tight ${task.completed ? 'line-through opacity-70' : ''}`}>
            {showTimeLabel && formattedTime && (
              <span className="text-brand-accent font-black mr-2 text-sm uppercase">{formattedTime} &middot;</span>
            )}
            {task.title}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTimerOpen(!isTimerOpen)}
            className={`p-2 transition-all border-4 ${
              isTimerOpen
                ? 'bg-brand-accent text-brand-bg border-brand-bg'
                : 'text-white border-transparent hover:border-white'
            }`}
            title="Focus Timer"
          >
            <Timer className="w-5 h-5 stroke-[3]" />
          </button>

          <button
            onClick={removeTask}
            className="opacity-0 group-hover:opacity-100 p-2 text-white hover:bg-white hover:text-brand-bg border-4 border-transparent hover:border-brand-bg transition-all"
          >
            <Trash2 className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>

      {isTimerOpen && (
        <div className="mt-4 pt-4 border-t-4 border-white/20">
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
      // Reset if trying to start from 0
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
    <div className="flex items-center gap-4 bg-brand-secondary p-3 border-4 border-white shadow-brutal-sm">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={minutesInput}
          onChange={(e) => setMinutesInput(e.target.value)}
          onBlur={handleInputBlur}
          disabled={isRunning}
          className="w-14 bg-white text-brand-bg font-black text-center border-4 border-transparent focus:border-brand-bg outline-none disabled:opacity-50"
          min="1"
          max="120"
        />
        <span className="text-white font-black text-xs uppercase tracking-wider">Min</span>
      </div>

      <div className="flex-1 text-center font-black text-2xl tracking-widest text-white tabular-nums">
        {formatTime(timeLeft)}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTimer}
          className="bg-white text-brand-bg p-2 border-4 border-brand-bg hover:bg-brand-accent hover:border-brand-accent transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          {isRunning ? <Pause className="w-5 h-5 stroke-[4]" /> : <Play className="w-5 h-5 stroke-[4] ml-0.5" />}
        </button>
        <button
          onClick={resetTimer}
          className="bg-transparent text-white p-2 border-4 border-transparent hover:border-white transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5 stroke-[3]" />
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

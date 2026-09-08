import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { cn } from '../utils/helpers';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();
  const { tasks } = useTasks();

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // pad beginning of month
  const startDay = days[0].getDay();
  const emptyDays = Array.from({ length: startDay });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDayClick = (dateStr: string) => {
    navigate(`/?date=${dateStr}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}

        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="h-14" />
        ))}

        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTasks = tasks.filter(t => t.scheduledDate === dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              className={cn(
                "h-14 flex flex-col items-center justify-start py-1 border border-transparent rounded-xl transition-colors hover:border-gray-200",
                !isSameMonth(day, currentMonth) && "opacity-50",
                isToday(day) && "bg-indigo-50 text-indigo-700 font-bold"
              )}
            >
              <span className="text-sm">{format(day, 'd')}</span>
              <div className="flex gap-0.5 mt-1">
                {dayTasks.slice(0, 3).map(( _, i ) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                ))}
                {dayTasks.length > 3 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

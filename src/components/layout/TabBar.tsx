import { NavLink } from 'react-router-dom';
import { Calendar, CheckSquare, MessageSquare, Moon, Activity } from 'lucide-react';
import { cn } from '../../utils/helpers';

const navItems = [
  { path: '/', icon: CheckSquare, label: 'Today' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/habits', icon: Activity, label: 'Habits' },
  { path: '/sleep', icon: Moon, label: 'Sleep' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
];

export function TabBar() {
  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                  isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                )
              }
            >
              <Icon size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  History, 
  UtensilsCrossed,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/schedule', label: 'Weekly Schedule', icon: Clock },
    { to: '/history', label: 'Payment History', icon: History },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-slate-200">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Meal Tracker</h1>
          <p className="text-xs text-slate-500">Expense & Payments</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-4 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      {user && (
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-50">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate" title={user.email}>
                {user.email}
              </p>
              <p className="text-[10px] text-slate-500">Connected</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

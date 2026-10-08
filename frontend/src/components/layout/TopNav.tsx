import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Menu, Bell } from "lucide-react";

interface TopNavProps { onMenuClick: () => void; }

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user } = useAuth();
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
      <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
      <div className="hidden md:block">
        <p className="text-sm font-semibold text-gray-700">
          Welcome back, <span className="text-indigo-600">{user?.firstName}</span>!
        </p>
      </div>
      <div className="flex items-center gap-3 ml-auto">
        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-all">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>
    </header>
  );
}

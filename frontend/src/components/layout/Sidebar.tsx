import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Layers, Users, CheckCircle,
  LogOut, BookOpen, Shield, Star, UserCircle, Trophy, FileText, Contact2
} from "lucide-react";

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  const roleColor: Record<string, string> = {
    ADMIN: "bg-purple-600",
    MENTOR: "bg-blue-600",
    CLUSTER_HEAD: "bg-teal-600",
    STUDENT: "bg-green-600",
  };
  const roleLabel: Record<string, string> = {
    ADMIN: "Super Admin",
    MENTOR: "Mentor",
    CLUSTER_HEAD: "Cluster Head",
    STUDENT: "Student",
  };
  const roleIcon: Record<string, React.ReactNode> = {
    ADMIN: <Shield className="w-4 h-4" />,
    MENTOR: <Star className="w-4 h-4" />,
    CLUSTER_HEAD: <Layers className="w-4 h-4" />,
    STUDENT: <UserCircle className="w-4 h-4" />,
  };

  const navLinks = {
    ADMIN: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Sections", href: "/admin/sections", icon: Layers },
      { label: "Mentors", href: "/admin/mentors", icon: Star },
      { label: "Versions", href: "/admin/versions", icon: CheckCircle },
      { label: "Final Results", href: "/admin/results", icon: Trophy },
    ],
    MENTOR: [
      { label: "Overview", href: "/mentor", icon: LayoutDashboard, exact: true },
      { label: "My Sections", href: "/mentor/sections", icon: Layers },
      { label: "Cluster Heads", href: "/mentor/cluster-heads", icon: Contact2 },
      { label: "Versions", href: "/mentor/versions", icon: CheckCircle },
      { label: "Final Results", href: "/mentor/results", icon: Trophy },
    ],
    CLUSTER_HEAD: [
      { label: "Overview", href: "/cluster-head", icon: LayoutDashboard, exact: true },
      { label: "My Sections", href: "/cluster-head/sections", icon: Layers },
      { label: "Versions", href: "/cluster-head/versions", icon: CheckCircle },
      { label: "Final Results", href: "/cluster-head/results", icon: Trophy },
    ],
    STUDENT: [
      { label: "Dashboard", href: "/student", icon: LayoutDashboard, exact: true },
    ],
  };

  const links = navLinks[user?.roleName as keyof typeof navLinks] || [];
  const color = roleColor[user?.roleName || ""] || "bg-indigo-600";

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm z-30 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">ProjectFlow</p>
            <p className="text-xs text-gray-400">Evaluation System</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-semibold ${color}`}>
          {roleIcon[user?.roleName || ""]}
          {roleLabel[user?.roleName || ""] || user?.roleName}
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {links.map(({ label, href, icon: Icon, exact }) => (
          <NavLink key={href} to={href} end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }>
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm`}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-sm font-medium transition-all">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Bell, BookOpen, CheckCircle, Contact2, FileText, Layers, LayoutDashboard,
  LogOut, Shield, Star, Trophy, UserCircle, Users
} from "lucide-react";

export function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = {
    ADMIN: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Clusters & Accounts", href: "/admin/clusters", icon: Users },
      { label: "Final Papers", href: "/admin/final-papers", icon: FileText },
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

  const roleLabel: Record<string, string> = {
    ADMIN: "Super Admin",
    MENTOR: "Mentor",
    CLUSTER_HEAD: "Cluster Head",
    STUDENT: "Student",
  };
  const roleColor: Record<string, string> = {
    ADMIN: "bg-purple-600",
    MENTOR: "bg-blue-600",
    CLUSTER_HEAD: "bg-teal-600",
    STUDENT: "bg-green-600",
  };
  const links = navLinks[user?.roleName as keyof typeof navLinks] || [];
  const color = roleColor[user?.roleName || ""] || "bg-indigo-600";

  return (
    <header className="sticky top-4 z-20 mx-4 rounded-2xl border border-white/80 bg-white/90 px-3 py-3 shadow-lg shadow-slate-200/50 backdrop-blur-md lg:mx-8">
      <div className="flex items-center gap-3">
        <NavLink to="/" className="flex shrink-0 items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-200">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-gray-900">ProjectFlow</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{roleLabel[user?.roleName || ""]}</p>
          </div>
        </NavLink>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map(({ label, href, icon: Icon, exact }) => (
            <NavLink key={href} to={href} end={exact}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`
              }>
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 border-l border-gray-100 pl-2">
          <button aria-label="Notifications" className="relative rounded-xl p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
            <Bell className="h-4 w-4" />
          </button>
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${color} text-xs font-bold text-white`}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <button
            aria-label="Sign out"
            onClick={() => { logout(); navigate("/login"); }}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

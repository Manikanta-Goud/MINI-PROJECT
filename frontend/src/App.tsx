import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/layout/Layout";
import Login from "./pages/auth/Login";
import StudentDashboard from "./pages/student/StudentDashboard";
import MentorDashboard from "./pages/mentor/MentorDashboard";
import ClusterHeadDashboard from "./pages/clusterHead/ClusterHeadDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.roleName) {
    case "STUDENT": return <Navigate to="/student" replace />;
    case "MENTOR": return <Navigate to="/mentor" replace />;
    case "CLUSTER_HEAD": return <Navigate to="/cluster-head" replace />;
    case "ADMIN": return <Navigate to="/admin" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<RoleBasedRedirect />} />
            <Route path="student" element={<StudentDashboard />} />
            <Route path="mentor" element={<MentorDashboard />} />
            <Route path="mentor/:tab" element={<MentorDashboard />} />
            <Route path="cluster-head" element={<ClusterHeadDashboard />} />
            <Route path="cluster-head/:tab" element={<ClusterHeadDashboard />} />
            <Route path="cluster_head" element={<ClusterHeadDashboard />} />
            <Route path="cluster_head/:tab" element={<ClusterHeadDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/:tab" element={<AdminDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

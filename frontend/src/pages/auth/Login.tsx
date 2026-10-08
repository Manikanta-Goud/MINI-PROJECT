import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { motion } from "framer-motion";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";

const DEMO = [
  { role: "Super Admin", email: "admin@college.edu", password: "Admin@1234", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { role: "Mentor", email: "mentor1@college.edu", password: "Mentor@1234", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { role: "Cluster Head", email: "ch1@college.edu", password: "Cluster@1234", color: "bg-teal-50 border-teal-200 text-teal-800" },
  { role: "Student", email: "student1@college.edu", password: "Student@1234", color: "bg-green-50 border-green-200 text-green-800" },
];

export default function Login() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );
  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter email and password"); return; }
    setIsLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const data = res.data?.data;
      if (data?.token && data?.user) {
        login(data.token, data.user);
        navigate("/", { replace: true });
      } else {
        setError("Login failed. Unexpected response from server.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (d: typeof DEMO[0]) => {
    setEmail(d.email);
    setPassword(d.password);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ProjectFlow</h1>
          <p className="text-gray-500 mt-1">Paper Submission & Evaluation System</p>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@college.edu"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : "Sign In"}
            </button>
          </form>
        </motion.div>

        {/* Demo Credentials */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6">
          <p className="text-center text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Click to fill demo credentials</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO.map(d => (
              <button key={d.role} onClick={() => fillDemo(d)}
                className={`p-3 rounded-2xl border text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${d.color}`}>
                <p className="font-bold text-sm">{d.role}</p>
                <p className="text-xs opacity-75 truncate">{d.email}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

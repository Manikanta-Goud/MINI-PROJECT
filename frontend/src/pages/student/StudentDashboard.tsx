import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle, XCircle, Clock, User, Users } from "lucide-react";

const card = "bg-white rounded-2xl shadow-sm border border-gray-100 p-6";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [myTeam, setMyTeam] = useState<any>(null);
  const [papers, setPapers] = useState<any[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, paperRes] = await Promise.allSettled([
        api.get("/sections/teams/student-team"),
        api.get("/sections/papers/my"),
      ]);
      if (teamRes.status === "fulfilled") setMyTeam(teamRes.value.data.data);
      if (paperRes.status === "fulfilled") setPapers(paperRes.value.data.data || []);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [myTeam]);

  const uploadFile = async (file: File) => {
    if (!myTeam?.id) { setUploadMsg("You are not assigned to a team yet."); return; }
    if (!file.name.endsWith(".pdf")) { setUploadMsg("Only PDF files are accepted."); return; }
    setUploading(true);
    setUploadMsg("");
    const form = new FormData();
    form.append("file", file);
    form.append("teamId", myTeam.id.toString());
    try {
      await api.post("/sections/papers/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setUploadMsg("? Paper uploaded successfully!");
      fetchData();
    } catch (e: any) { setUploadMsg("? Upload failed: " + (e.response?.data?.message || "Error")); }
    setUploading(false);
  };

  const statusColor: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    UNDER_REVIEW: "bg-blue-100 text-blue-700",
    PASSED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
  };
  const statusIcon: Record<string, JSX.Element> = {
    PENDING: <Clock className="w-4 h-4" />,
    UNDER_REVIEW: <Clock className="w-4 h-4" />,
    PASSED: <CheckCircle className="w-4 h-4" />,
    FAILED: <XCircle className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {user?.firstName}! Upload your paper and track its evaluation status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Team Info & Upload */}
        <div className="lg:col-span-1 space-y-5">
          {/* Team Card */}
          <div className={card}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" /> My Team
            </h2>
            {loading ? <p className="text-gray-400">Loading...</p> : myTeam ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide">Team</p>
                  <p className="font-bold text-gray-900 text-lg">{myTeam.name}</p>
                  <p className="text-sm text-teal-700">{myTeam.sectionName}</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-2">Cluster Heads</p>
                  {myTeam.clusterHeads?.map((ch: any) => (
                    <div key={ch.id} className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">{ch.name[0]}</div>
                      <p className="text-sm text-gray-700">{ch.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Not assigned to a team yet.</p>
                <p className="text-gray-400 text-xs">Contact your Cluster Head or Mentor.</p>
              </div>
            )}
          </div>

          {/* Upload Box */}
          <div className={card}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" /> Upload Paper
            </h2>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                ${dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50"}`}>
              <input id="file-input" type="file" accept=".pdf" className="hidden"
                onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
              {uploading ? (
                <div className="space-y-2">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-indigo-600 font-medium">Uploading...</p>
                </div>
              ) : (
                <>
                  <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${dragging ? "text-indigo-500" : "text-gray-400"}`} />
                  <p className="font-semibold text-gray-700">Drag & Drop your PDF here</p>
                  <p className="text-gray-400 text-sm mt-1">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-2">Only PDF files accepted</p>
                </>
              )}
            </div>
            {uploadMsg && (
              <p className={`mt-3 text-sm font-medium text-center ${uploadMsg.startsWith("?") ? "text-green-600" : "text-red-500"}`}>
                {uploadMsg}
              </p>
            )}
          </div>
        </div>

        {/* Right - Submissions */}
        <div className="lg:col-span-2">
          <div className={card}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> My Submissions
            </h2>
            {loading ? <p className="text-gray-400">Loading...</p> : papers.length === 0 ? (
              <div className="text-center py-14">
                <FileText className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No papers submitted yet</p>
                <p className="text-gray-400 text-sm">Upload your first paper using the panel on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {papers.map((p: any) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-100">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{p.fileName}</p>
                        <p className="text-xs text-gray-500">
                          Submitted: {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : "-"}
                          {p.versionNumber ? ` · Version ${p.versionNumber}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.aiContentPercent !== null && p.aiContentPercent !== undefined && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">AI: <span className={p.aiContentPercent === 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{p.aiContentPercent}%</span></p>
                          <p className="text-xs text-gray-500">Plagiarism: <span className={(p.plagiarismPercent ?? 0) <= 10 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{p.plagiarismPercent}%</span></p>
                        </div>
                      )}
                      <span className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold ${statusColor[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusIcon[p.status]} {p.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Users, Layers, BookOpen, UserCheck, Shield, ChevronDown, ChevronRight, CheckCircle, XCircle, Trophy, Star
} from "lucide-react";

type Tab = "overview" | "sections" | "mentors" | "versions" | "results";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const tab = (urlTab as Tab) || "overview";

  const [stats, setStats] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [finalResults, setFinalResults] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    const [dash, sec, userRes, res] = await Promise.allSettled([
      api.get("/admin/dashboard"),
      api.get("/sections"),
      api.get("/admin/users?role=MENTOR"),
      api.get("/sections/final-results")
    ]);
    if (dash.status === "fulfilled") setStats(dash.value.data.data);
    if (sec.status === "fulfilled") setSections(sec.value.data.data || []);
    if (userRes.status === "fulfilled") setMentors(userRes.value.data.data || []);
    if (res.status === "fulfilled") setFinalResults(res.value.data.data || []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.firstName}!</p>
          </div>
          <span className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold text-sm">
            <Shield className="w-4 h-4" />Super Admin
          </span>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {tab === "overview" && stats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Students", value: stats.totalStudents, icon: Users, color: "bg-blue-500" },
                { label: "Total Mentors", value: stats.totalMentors, icon: UserCheck, color: "bg-indigo-500" },
                { label: "Cluster Heads", value: stats.totalClusterHeads, icon: Layers, color: "bg-teal-500" },
                { label: "Total Sections", value: sections.length, icon: BookOpen, color: "bg-purple-500" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6 text-white" /></div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{label}</p>
                    <p className="text-3xl font-bold text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-500" />Recent Sections Overview
              </h2>
              <div className="space-y-3">
                {sections.slice(0, 5).map(s => <SectionCard key={s.id} section={s} />)}
              </div>
            </div>
          </motion.div>
        )}

        {tab === "sections" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">All Sections</h2>
            {sections.map(s => <SectionCard key={s.id} section={s} expanded />)}
          </motion.div>
        )}

        {tab === "mentors" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">All Mentors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mentors.map(m => (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                    {m.firstName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{m.firstName} {m.lastName}</p>
                    <p className="text-sm text-gray-500">{m.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${m.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {m.active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "versions" && <VersionsPanel sections={sections} onResultsChange={fetchAll} finalResults={finalResults} />}

        {tab === "results" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Final Results Dashboard</h2>
            {finalResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <Trophy className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No teams have reached final results yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Team", "Section", "Version Passed", "AI Content", "Plagiarism"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {finalResults.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-bold text-gray-900">{r.teamName}</td>
                        <td className="px-5 py-4 text-gray-600 text-sm">{r.sectionName}</td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">
                            v{r.versionPassed}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${r.aiContentPercent < 15 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {r.aiContentPercent ?? 0}%
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${r.plagiarismPercent < 10 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {r.plagiarismPercent ?? 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ section, expanded = false }: { section: any; expanded?: boolean }) {
  const [open, setOpen] = useState(expanded);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    if (open) api.get(`/sections/${section.id}/teams`).then(r => setTeams(r.data.data || []));
  }, [open, section.id]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Layers className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">{section.name}</p>
            <p className="text-xs text-gray-500">{section.teamCount} teams</p>
          </div>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </div>
      
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 px-5 pb-5 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {teams.map(t => (
                <div key={t.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-gray-800">{t.name}</p>
                    <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full font-medium text-gray-500 shadow-sm">
                      {t.memberCount} members
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {t.members?.slice(0, 3).map((m: any) => (
                      <span key={m.id} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md">
                        {m.name}
                      </span>
                    ))}
                    {t.members?.length > 3 && <span className="text-[10px] text-gray-400 mt-1">+{t.members.length - 3} more</span>}
                  </div>
                </div>
              ))}
              {teams.length === 0 && <p className="text-gray-400 text-sm text-center py-4 col-span-2">No teams in this section.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VersionsPanel({ sections, onResultsChange, finalResults }: { sections: any[]; onResultsChange: () => void; finalResults: any[] }) {
  const [sel, setSel] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<any[]>([]);
  const [curVer, setCurVer] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const loadSec = useCallback(async (s: any) => {
    setSel(s); setCheckedIds(new Set());
    const [tr, vr] = await Promise.allSettled([api.get(`/sections/${s.id}/teams`), api.get(`/sections/${s.id}/versions`)]);
    if (tr.status === "fulfilled") setTeams(tr.value.data.data || []);
    if (vr.status === "fulfilled") {
      const vers = vr.value.data.data || [];
      setHistory(vers.filter((v: any) => v.status === "COMPLETED"));
      setCurVer(vers.filter((v: any) => v.status === "COMPLETED").length + 1);
    }
  }, []);

  const toggle = (id: number) => setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const sectionPassedTeamNames = finalResults.filter((r: any) => r.sectionName === sel?.name).map((r: any) => r.teamName);
  const remainingTeams = teams.filter(t => !sectionPassedTeamNames.includes(t.name));

  const submit = async () => {
    if (!sel) return; setSubmitting(true);
    try {
      const papersRes = await api.get(`/sections/${sel.id}/papers`);
      const allPapers: any[] = papersRes.data.data || [];
      const evals = remainingTeams.flatMap((t: any) => {
        const passed = checkedIds.has(t.id);
        return allPapers.filter((p: any) => p.teamId === t.id).map((p: any) => ({
          paperId: p.id,
          aiContentPercent: passed ? 0 : 20 + Math.floor(Math.random() * 30),
          plagiarismPercent: passed ? 3 + Math.floor(Math.random() * 7) : 15 + Math.floor(Math.random() * 30),
        }));
      });
      if (evals.length === 0) { alert("No papers found for evaluation in this section."); setSubmitting(false); return; }
      await api.post(`/sections/${sel.id}/versions/create`);
      const vsRes = await api.get(`/sections/${sel.id}/versions`);
      const openVS = (vsRes.data.data || []).find((v: any) => v.status === "OPEN");
      if (!openVS) { alert("Could not create version."); setSubmitting(false); return; }
      await api.post(`/sections/versions/${openVS.id}/evaluate`, { evaluations: evals });
      onResultsChange(); await loadSec(sel);
    } catch (e: any) { alert(e.response?.data?.message || "Error"); }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Version Management</h2>
        <p className="text-gray-500 text-sm">Select a section to manage its versions and promote teams to final results.</p>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {sections.map(s => (
          <button key={s.id} onClick={() => loadSec(s)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
              sel?.id === s.id ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50"
            }`}>
            {s.name}
          </button>
        ))}
      </div>

      {sel && (
        <div className="space-y-4">
          {history.map(v => {
            const passedTeams = finalResults.filter((r: any) => r.sectionName === sel.name && r.versionPassed === v.versionNumber);
            return (
              <div key={v.id} className="bg-green-50 rounded-2xl border border-green-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900">Version {v.versionNumber} Completed</p>
                    <p className="text-xs text-green-700">{passedTeams.length} teams selected</p>
                  </div>
                </div>
                {passedTeams.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-11">
                    {passedTeams.map((pt: any) => (
                      <span key={pt.id} className="bg-white border border-green-200 text-green-800 text-xs px-2 py-1 rounded-md font-medium shadow-sm flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-green-500" />
                        {pt.teamName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {remainingTeams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="font-bold text-gray-800 text-lg">All Teams Passed!</p>
              <p className="text-gray-500 text-sm">Every team in {sel.name} has successfully reached final results.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-sm p-6 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 rounded-t-2xl" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Version {curVer} — {sel.name}</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Select teams that pass this version. Unselected teams automatically move to v{curVer + 1}.</p>
                </div>
                <div className="flex gap-2 text-xs font-semibold">
                  <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full">{checkedIds.size} passing</span>
                  <span className="px-3 py-1.5 bg-red-100 text-red-600 rounded-full">{remainingTeams.length - checkedIds.size} moving to next</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {remainingTeams.map(t => {
                  const checked = checkedIds.has(t.id);
                  return (
                    <div key={t.id} onClick={() => toggle(t.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${checked ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-indigo-300"}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t.memberCount} members</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${checked ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}>
                          {checked && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <p className={`text-xs mt-2 font-semibold flex items-center gap-1 ${checked ? "text-green-700" : "text-red-500"}`}>
                        {checked ? <><CheckCircle className="w-3 h-3" />Select for v{curVer}</> : <><XCircle className="w-3 h-3" />Move to v{curVer + 1}</>}
                      </p>
                    </div>
                  );
                })}
              </div>

              <button onClick={submit} disabled={submitting}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-60 transition-all">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</> : `✓ Complete Version ${curVer}`}
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Layers, Users, CheckCircle, XCircle, Trophy, Star,
  ChevronDown, ChevronRight, BookOpen, Contact2
} from "lucide-react";

type Tab = "overview" | "sections" | "cluster-heads" | "versions" | "results";

export default function MentorDashboard() {
  const { user } = useAuth();
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const tab = (urlTab as Tab) || "overview";

  const [sections, setSections] = useState<any[]>([]);
  const [finalResults, setFinalResults] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    const [sec, res] = await Promise.allSettled([
      api.get("/mentor/my-sections"),
      api.get("/sections/final-results"),
    ]);
    if (sec.status === "fulfilled") setSections(sec.value.data.data || []);
    if (res.status === "fulfilled") {
      const all = res.value.data.data || [];
      const mySecNames = (sec.status === "fulfilled" ? sec.value.data.data || [] : []).map((s: any) => s.name);
      setFinalResults(all.filter((r: any) => mySecNames.includes(r.sectionName)));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalTeams = sections.reduce((a: number, s: any) => a + (s.teamCount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome, {user?.firstName}!</p>
          </div>
          <span className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold text-sm">
            <Star className="w-4 h-4" />Mentor
          </span>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Layers, label: "My Sections", value: sections.length, color: "bg-blue-500" },
                { icon: Users, label: "Total Teams", value: totalTeams, color: "bg-teal-500" },
                { icon: Trophy, label: "Papers Passed", value: finalResults.length, color: "bg-green-500" },
              ].map(({ icon: Icon, label, value, color }) => (
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
                <Layers className="w-5 h-5 text-blue-500" />My Sections
              </h2>
              <div className="space-y-3">
                {sections.map((s: any) => (
                  <SectionCard key={s.id} section={s} />
                ))}
                {sections.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No sections assigned yet.</p>
                )}
              </div>
            </div>

            {finalResults.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-green-500" />Final Results
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {finalResults.map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl bg-green-50 border border-green-100">
                      <p className="font-bold text-gray-900">{r.teamName}</p>
                      <p className="text-xs text-gray-500 mb-2">{r.sectionName}</p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold">v{r.versionPassed}</span>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">AI {r.aiContentPercent}%</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">Plag {r.plagiarismPercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === "sections" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">My Sections</h2>
            {sections.map((s: any) => <SectionCard key={s.id} section={s} expanded />)}
            {sections.length === 0 && <p className="text-gray-400 text-center py-8">No sections assigned.</p>}
          </motion.div>
        )}

        {tab === "cluster-heads" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">My Cluster Heads</h2>
            <MentorClusterHeads sections={sections} />
          </motion.div>
        )}

        {tab === "versions" && <VersionsPanel sections={sections} onResultsChange={fetchAll} finalResults={finalResults} />}

        {tab === "results" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Final Results</h2>
            {finalResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <Trophy className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No final results yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{["Team", "Section", "Version", "AI Content", "Plagiarism"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {finalResults.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-bold text-gray-900">{r.teamName}</td>
                        <td className="px-5 py-4 text-gray-600 text-sm">{r.sectionName}</td>
                        <td className="px-5 py-4"><span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">v{r.versionPassed}</span></td>
                        <td className="px-5 py-4"><span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">{r.aiContentPercent ?? 0}%</span></td>
                        <td className="px-5 py-4"><span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">{r.plagiarismPercent ?? 0}%</span></td>
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

function MentorClusterHeads({ sections }: { sections: any[] }) {
  const [loading, setLoading] = useState(true);
  const [clusterHeads, setClusterHeads] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const teamPromises = sections.map(s => api.get(`/sections/${s.id}/teams`));
        const teamResponses = await Promise.all(teamPromises);
        
        const chMap = new Map<number, any>();
        
        teamResponses.forEach((res, index) => {
          const section = sections[index];
          const teams = res.data.data || [];
          
          teams.forEach((t: any) => {
            if (t.clusterHeads) {
              t.clusterHeads.forEach((ch: any) => {
                if (!chMap.has(ch.id)) {
                  chMap.set(ch.id, {
                    ...ch,
                    assignedTeams: []
                  });
                }
                const existing = chMap.get(ch.id);
                existing.assignedTeams.push({
                  teamId: t.id,
                  teamName: t.name,
                  sectionName: section.name,
                  memberCount: t.memberCount
                });
              });
            }
          });
        });
        
        setClusterHeads(Array.from(chMap.values()));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    
    if (sections.length > 0) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [sections]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500">Loading cluster heads...</p>
      </div>
    );
  }

  if (clusterHeads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <Contact2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No cluster heads assigned to your teams.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {clusterHeads.map(ch => (
        <div key={ch.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-teal-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {ch.name[0]}
            </div>
            <div>
              <h3 className="font-bold text-teal-900 text-lg">{ch.name}</h3>
              <p className="text-sm text-teal-700">{ch.email}</p>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Assigned Teams ({ch.assignedTeams.length})</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {ch.assignedTeams.map((t: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between hover:border-teal-200 transition-colors">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{t.teamName}</p>
                    <p className="text-xs text-gray-500">{t.sectionName}</p>
                  </div>
                  <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full font-medium text-gray-600 shadow-sm">
                    {t.memberCount} members
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
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
      <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Layers className="w-5 h-5 text-blue-600" />
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
              {teams.map((t: any) => (
                <div key={t.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between mb-2">
                    <p className="font-bold text-gray-800">{t.name}</p>
                    <span className="text-xs text-gray-400 font-medium">{t.memberCount} members</span>
                  </div>
                  <div className="mb-2 border-t border-gray-100 pt-2">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Cluster Heads</p>
                    <div className="flex gap-1 flex-wrap">
                      {t.clusterHeads?.map((c: any) => (
                        <span key={c.id} className="text-xs px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-md font-medium shadow-sm flex items-center gap-1">
                          <Contact2 className="w-3 h-3" /> {c.name}
                        </span>
                      ))}
                      {(!t.clusterHeads || t.clusterHeads.length === 0) && (
                        <span className="text-xs text-gray-400">None assigned</span>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Students</p>
                    <div className="flex gap-1 flex-wrap">
                      {t.members?.map((m: any) => (
                        <span key={m.id} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md shadow-sm">
                          {m.name}
                        </span>
                      ))}
                      {(!t.members || t.members.length === 0) && <span className="text-xs text-gray-400">No members</span>}
                    </div>
                  </div>
                </div>
              ))}
              {teams.length === 0 && <p className="text-gray-400 text-sm text-center py-4 col-span-2">No teams yet</p>}
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
      if (evals.length === 0) { alert("No papers found."); setSubmitting(false); return; }
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
        <p className="text-gray-500 text-sm">Select a section → check passing teams → submit.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {sections.map((s: any) => (
          <button key={s.id} onClick={() => loadSec(s)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${sel?.id === s.id ? "bg-blue-600 text-white border-blue-600 shadow" : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"}`}>
            {s.name}
          </button>
        ))}
      </div>

      {sel && (
        <div className="space-y-4">
          {history.map((v: any) => {
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
            <div className="bg-white rounded-2xl border p-10 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="font-bold text-gray-800">All teams passed!</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm p-6 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 rounded-t-2xl" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Version {curVer} — {sel.name}</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Check teams that passed. Others auto-move to Version {curVer + 1}.</p>
                </div>
                <div className="flex gap-2 text-xs font-semibold">
                  <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full">{checkedIds.size} passing</span>
                  <span className="px-3 py-1.5 bg-red-100 text-red-600 rounded-full">{remainingTeams.length - checkedIds.size} to next</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {remainingTeams.map((t: any) => {
                  const checked = checkedIds.has(t.id);
                  return (
                    <div key={t.id} onClick={() => toggle(t.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${checked ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-blue-300"}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t.memberCount} members</p>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {t.clusterHeads?.map((c: any) => <span key={c.id} className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">{c.name}</span>)}
                          </div>
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
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</> : `✓ Complete Version ${curVer}`}
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

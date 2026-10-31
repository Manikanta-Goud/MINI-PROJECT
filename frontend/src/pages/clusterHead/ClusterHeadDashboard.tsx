import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Layers, Users, CheckCircle, XCircle, Trophy,
  ChevronDown, ChevronRight, Plus, Trash2, UserCheck,
  Mail, Phone, BookOpen, AlertCircle
} from "lucide-react";


type Tab = "overview" | "sections" | "teams" | "mentors" | "versions" | "results";

export default function ClusterHeadDashboard() {
  const { user } = useAuth();
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const tab = (urlTab as Tab) || "overview";

  const [cluster, setCluster] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [finalResults, setFinalResults] = useState<any[]>([]);
  const [clusterError, setClusterError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [cr, sr, tr, mr, rr] = await Promise.allSettled([
      api.get("/cluster-head/my-cluster"),
      api.get("/cluster-head/my-sections"),
      api.get("/cluster-head/my-teams"),
      api.get("/cluster-head/my-mentors"),
      api.get("/sections/final-results"),
    ]);

    if (cr.status === "fulfilled") {
      setCluster(cr.value.data.data || null);
      setClusterError("");
    } else {
      setClusterError(cr.reason?.response?.data?.message || "Could not load cluster details.");
    }
    if (sr.status === "fulfilled") setSections(sr.value.data.data || []);
    if (tr.status === "fulfilled") setTeams(tr.value.data.data || []);
    if (mr.status === "fulfilled") setMentors(mr.value.data.data || []);
    if (rr.status === "fulfilled") {
      const all = rr.value.data.data || [];
      setFinalResults(all);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const teamsBySection = sections.map(s => ({
    section: s,
    teams: teams.filter(t => t.sectionId === s.id),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {cluster?.name ? `${cluster.name} Portal` : "Cluster Head Dashboard"}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome, {user?.firstName}!</p>
          </div>
          <span className="flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full font-bold text-sm">
            <Layers className="w-4 h-4" />Cluster Head
          </span>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {clusterError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {clusterError} — You may not be assigned to a cluster yet. Contact your Super Admin.
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── OVERVIEW ─────────────────────────────────────────── */}
            {tab === "overview" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: Layers, label: "My Sections", value: sections.length, color: "bg-teal-500" },
                    { icon: Users, label: "Total Teams", value: teams.length, color: "bg-blue-500" },
                    { icon: BookOpen, label: "Mentors", value: mentors.length, color: "bg-indigo-500" },
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

                {/* Sections summary */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-500" />My Sections Overview
                  </h2>
                  {sections.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">No sections assigned yet. Contact your Super Admin.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sections.map(s => (
                        <div key={s.id} className="rounded-xl bg-teal-50 border border-teal-100 p-4">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-gray-900">{s.name}</p>
                            <span className="text-xs bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full font-semibold">{s.teamCount} teams</span>
                          </div>
                          {s.mentorName && (
                            <p className="text-xs text-teal-700 mt-1 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />{s.mentorName}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mentors summary */}
                {mentors.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-500" />Mentors in My Cluster
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {mentors.map(m => (
                        <div key={m.id} className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm mb-2">
                            {m.name?.[0]}
                          </div>
                          <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                          <p className="text-xs text-gray-500 truncate">{m.email}</p>
                          {m.assignedSections?.length > 0 && (
                            <p className="text-xs text-indigo-700 mt-1">
                              {m.assignedSections.join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── MY SECTIONS ──────────────────────────────────────── */}
            {tab === "sections" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">My Sections</h2>
                <p className="text-gray-500 text-sm">Sections assigned to your cluster by the Super Admin.</p>
                {sections.length === 0 ? (
                  <div className="bg-white rounded-2xl border p-16 text-center">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-500 font-medium">No sections assigned yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Contact your Super Admin to assign sections to your cluster.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamsBySection.map(({ section, teams: secTeams }) => (
                      <SectionCard key={section.id} section={section} teams={secTeams} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TEAMS ────────────────────────────────────────────── */}
            {tab === "teams" && (
              <TeamsPanel sections={sections} mentors={mentors} onRefresh={fetchAll} />
            )}

            {/* ── MENTORS ──────────────────────────────────────────── */}
            {tab === "mentors" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Mentors / Guides</h2>
                <p className="text-gray-500 text-sm">All mentors assigned to your cluster by the Super Admin.</p>
                {mentors.length === 0 ? (
                  <div className="bg-white rounded-2xl border p-16 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-500 font-medium">No mentors assigned to your cluster yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Contact your Super Admin to assign mentors.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mentors.map(m => (
                      <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {m.name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{m.name}</p>
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Mentor</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{m.email}</span>
                          </div>
                          {m.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span>{m.phone}</span>
                            </div>
                          )}
                        </div>
                        {m.assignedSections?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Assigned Sections</p>
                            <div className="flex flex-wrap gap-1">
                              {m.assignedSections.map((sec: string) => (
                                <span key={sec} className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">{sec}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── VERSIONS ─────────────────────────────────────────── */}
            {tab === "versions" && <VersionsPanel sections={sections} myTeams={teams} onResultsChange={fetchAll} finalResults={finalResults} />}

            {/* ── FINAL RESULTS ────────────────────────────────────── */}
            {tab === "results" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Final Results</h2>
                {finalResults.length === 0 ? (
                  <div className="bg-white rounded-2xl border p-16 text-center">
                    <Trophy className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No final results yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>{["Team", "Section", "Cluster", "Mentor", "Paper", "Version", "Plagiarism", "AI Content", "Status"].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {finalResults.map((r: any) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-5 py-4 font-bold text-gray-900">{r.teamName}</td>
                            <td className="px-5 py-4 text-gray-600 text-sm">{r.sectionName}</td>
                            <td className="px-5 py-4 text-gray-600 text-sm">{r.clusterName || "—"}</td>
                            <td className="px-5 py-4 text-gray-600 text-sm">{r.mentorName || "—"}</td>
                            <td className="px-5 py-4 text-gray-700 text-sm font-medium">{r.paperName || "Project Paper"}</td>
                            <td className="px-5 py-4"><span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">v{r.versionPassed}</span></td>
                            <td className="px-5 py-4"><span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-bold">{r.plagiarismPercent ?? 0}%</span></td>
                            <td className="px-5 py-4"><span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-bold">{r.aiContentPercent ?? 0}%</span></td>
                            <td className="px-5 py-4">
                              <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Passed
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
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CARD (read-only, for My Sections tab)
// ─────────────────────────────────────────────────────────────────────────────
function SectionCard({ section, teams }: { section: any; teams: any[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <Layers className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">{section.name}</p>
            <p className="text-xs text-gray-500">
              {teams.length} team{teams.length !== 1 ? "s" : ""}
              {section.mentorName && <> · Mentor: <span className="text-teal-700 font-semibold">{section.mentorName}</span></>}
            </p>
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
                <div key={t.id} className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="flex justify-between mb-1">
                    <p className="font-bold text-gray-800">{t.name}</p>
                    <span className="text-xs text-gray-400">{t.memberCount} members</span>
                  </div>
                  {t.assignedMentors?.length > 0 && (
                    <p className="text-xs text-indigo-700 flex items-center gap-1 mt-1">
                      <BookOpen className="w-3 h-3" />{t.assignedMentors[0].name}
                    </p>
                  )}
                </div>
              ))}
              {teams.length === 0 && <p className="text-gray-400 text-sm py-4 col-span-2 text-center">No teams yet. Go to Teams tab to create some.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014
// TEAMS PANEL \u2014 Create/Delete teams per section, Assign mentors to teams
// \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014
function TeamsPanel({ sections, mentors }: { sections: any[]; mentors: any[]; onRefresh: () => void }) {
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [sectionTeams, setSectionTeams] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Inline add-form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addTeamName, setAddTeamName] = useState("");
  const [addMentorId, setAddMentorId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [addError, setAddError] = useState("");

  const loadTeams = useCallback(async (section: any) => {
    setSelectedSection(section);
    setError("");
    const res = await api.get(`/cluster-head/sections/${section.id}/teams`);
    setSectionTeams(res.data.data || []);
  }, []);

  // Auto-select first section on mount
  useEffect(() => {
    if (sections.length > 0 && !selectedSection) {
      loadTeams(sections[0]);
    }
  }, [sections, selectedSection, loadTeams]);

  const deleteTeam = async (teamId: number) => {
    if (!window.confirm("Delete this team?")) return;
    try {
      await api.delete(`/cluster-head/teams/${teamId}`);
      // Update local state only — no full page refresh
      setSectionTeams(prev => prev.filter(t => t.id !== teamId));
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to delete team");
    }
  };

  const assignMentor = async (teamId: number, mentorId: number | null) => {
    setAssigning(teamId);
    try {
      await api.put(`/cluster-head/teams/${teamId}/assign-mentor`, { mentorId });
      // Update local state only — find the mentor name and patch team
      setSectionTeams(prev => prev.map(t => {
        if (t.id !== teamId) return t;
        const mentor = mentors.find(m => m.id === mentorId);
        return { ...t, assignedMentors: mentor ? [{ id: mentor.id, name: mentor.name, email: mentor.email }] : [] };
      }));
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to assign mentor");
    }
    setAssigning(null);
  };

  const openAddForm = () => { setAddTeamName(""); setAddMentorId(""); setAddError(""); setShowAddForm(true); };
  const cancelAddForm = () => { setShowAddForm(false); setAddTeamName(""); setAddMentorId(""); setAddError(""); };

  const submitAddForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTeamName.trim() || !selectedSection) return;
    setCreating(true); setAddError("");
    try {
      const res = await api.post(`/cluster-head/sections/${selectedSection.id}/teams`, { name: addTeamName.trim() });
      const newTeam = res.data.data;
      if (addMentorId && newTeam?.id) {
        try { await api.put(`/cluster-head/teams/${newTeam.id}/assign-mentor`, { mentorId: Number(addMentorId) }); } catch (_) {}
      }
      setShowAddForm(false); setAddTeamName(""); setAddMentorId("");
      // Reload just this section's teams — no full page refresh
      await loadTeams(selectedSection);
    } catch (e: any) {
      setAddError(e.response?.data?.message || "Failed to create team");
    }
    setCreating(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Teams Management</h2>
        <p className="text-gray-500 text-sm mt-0.5">Select a section to create teams and assign mentors.</p>
      </div>
      {sections.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center">
          <Layers className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">No sections assigned yet.</p>
          <p className="text-gray-400 text-sm mt-1">Contact your Super Admin to assign sections.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-64 flex-shrink-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Select Section</p>
            <div className="space-y-2">
              {sections.map(s => (
                <button key={s.id} onClick={() => { loadTeams(s); setShowAddForm(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${selectedSection?.id === s.id
                    ? "bg-teal-600 text-white border-teal-600 shadow"
                    : "bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:bg-teal-50"}`}>
                  <p>{s.name}</p>
                  {s.mentorName && <p className={`text-xs mt-0.5 ${selectedSection?.id === s.id ? "text-teal-100" : "text-gray-400"}`}>{s.mentorName}</p>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            {!selectedSection ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
                <Layers className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400">Select a section from the left to manage its teams.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-500" />{selectedSection.name} — Teams
                    </h3>
                    {!showAddForm && (
                      <button onClick={openAddForm}
                        className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-sm">
                        <Plus className="w-4 h-4" /> Add Team
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {showAddForm && (
                      <motion.div key="add-form"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <form onSubmit={submitAddForm}
                          className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-3">
                          <p className="text-sm font-bold text-teal-700 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Team
                          </p>
                          {addError && (
                            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</div>
                          )}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Team Name *</label>
                              <input type="text" autoFocus value={addTeamName}
                                onChange={e => setAddTeamName(e.target.value)}
                                placeholder="e.g. Team Alpha, Team 1..."
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 bg-white"
                                onKeyDown={e => { if (e.key === "Escape") cancelAddForm(); }} />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Mentor (optional)</label>
                              <select value={addMentorId} onChange={e => setAddMentorId(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 bg-white text-gray-700">
                                <option value="">No mentor assigned</option>
                                {mentors.map(m => (
                                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={cancelAddForm}
                              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                              Cancel
                            </button>
                            <button type="submit" disabled={creating || !addTeamName.trim()}
                              className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-teal-700 disabled:opacity-50 transition-all">
                              {creating
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <CheckCircle className="w-4 h-4" />}
                              Create Team
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</div>
                  )}

                  {sectionTeams.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No teams yet. Click <span className="font-semibold text-teal-600">+ Add Team</span> above to create your first team!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sectionTeams.map(team => (
                        <div key={team.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {team.name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{team.name}</p>
                            <p className="text-xs text-gray-400">{team.memberCount} student{team.memberCount !== 1 ? "s" : ""}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <select
                              value={team.assignedMentors?.[0]?.id || ""}
                              onChange={e => assignMentor(team.id, e.target.value ? Number(e.target.value) : null)}
                              disabled={assigning === team.id}
                              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 bg-white text-gray-700 max-w-[160px]">
                              <option value="">No mentor</option>
                              {mentors.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                            {assigning === team.id && <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />}
                          </div>
                          <button onClick={() => deleteTeam(team.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VERSIONS PANEL — simplified: checkbox per team → passed/not passed
// ─────────────────────────────────────────────────────────────────────────────
function VersionsPanel({ sections, myTeams, onResultsChange, finalResults }: {
  sections: any[]; myTeams: any[]; onResultsChange: () => void; finalResults: any[];
}) {
  const [sel, setSel] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<any[]>([]);
  const [curVer, setCurVer] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const loadSec = useCallback(async (s: any) => {
    setSel(s); setCheckedIds(new Set());
    const sectionTeams = myTeams.filter(t => t.sectionId === s.id);
    setTeams(sectionTeams);
    const vr = await api.get(`/sections/${s.id}/versions`);
    if (vr.status === 200) {
      const vers = vr.data.data || [];
      const completed = vers.filter((v: any) => v.status === "COMPLETED");
      setHistory(completed);
      setCurVer(completed.length + 1);
    }
  }, [myTeams]);

  const toggle = (id: number) => setCheckedIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const sectionPassedTeamNames = finalResults.filter((r: any) => r.sectionName === sel?.name).map((r: any) => r.teamName);
  const remainingTeams = teams.filter(t => !sectionPassedTeamNames.includes(t.name));

  const submit = async () => {
    if (!sel) return; setSubmitting(true);
    try {
      // Create version session if none exists
      try { await api.post(`/sections/${sel.id}/versions/create`); } catch { /* ignore if already open */ }
      const vsRes = await api.get(`/sections/${sel.id}/versions`);
      const openVS = (vsRes.data.data || []).find((v: any) => v.status === "OPEN");
      if (!openVS) { alert("Could not create version."); setSubmitting(false); return; }

      const evals = remainingTeams.map((t: any) => ({
        teamId: t.id,
        passed: checkedIds.has(t.id),
      }));

      await api.post(`/sections/versions/${openVS.id}/evaluate`, { evaluations: evals });
      onResultsChange();
      await loadSec(sel);
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
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${sel?.id === s.id ? "bg-teal-600 text-white border-teal-600 shadow" : "bg-white text-gray-700 border-gray-200 hover:border-teal-400"}`}>
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
                    <p className="text-xs text-green-700">{passedTeams.length} teams passed</p>
                  </div>
                </div>
                {passedTeams.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-11">
                    {passedTeams.map((pt: any) => (
                      <span key={pt.id} className="bg-white border border-green-200 text-green-800 text-xs px-2 py-1 rounded-md font-medium shadow-sm flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-green-500" />{pt.teamName}
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
              <p className="font-bold text-gray-800">All teams have passed!</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-teal-100 shadow-sm p-6 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 rounded-t-2xl" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Version {curVer} — {sel.name}</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Check passing teams. Others move to Version {curVer + 1}.</p>
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
                    <div
                      key={t.id}
                      onClick={() => toggle(t.id)}
                      className={`rounded-xl border-2 transition-all p-4 cursor-pointer select-none flex items-center gap-3 ${
                        checked ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-teal-300"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checked ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}>
                        {checked && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.memberCount} members</p>
                      </div>
                      <p className={`text-xs font-semibold flex items-center gap-1 shrink-0 ${checked ? "text-green-700" : "text-red-500"}`}>
                        {checked ? <><CheckCircle className="w-3 h-3" />Pass v{curVer}</> : <><XCircle className="w-3 h-3" />Move to v{curVer + 1}</>}
                      </p>
                    </div>
                  );
                })}
              </div>
              <button onClick={submit} disabled={submitting}
                className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-teal-700 flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</> : `✓ Complete Version ${curVer}`}
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Users, CheckCircle, XCircle, Trophy, Star,
  BookOpen, Contact2, Plus, Trash2, UserCheck,
  Mail, Key, Shield, UserPlus
} from "lucide-react";


type Tab = "overview" | "teams" | "cluster-heads" | "versions" | "results";

export default function MentorDashboard() {
  const { user } = useAuth();
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const tab = (urlTab as Tab) || "overview";

  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [finalResults, setFinalResults] = useState<any[]>([]);
  const [clusterInfo, setClusterInfo] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    const [teams, res, chs] = await Promise.allSettled([
      api.get("/mentor/my-teams"),
      api.get("/sections/final-results"),
      api.get("/mentor/my-cluster-heads"),
    ]);
    if (teams.status === "fulfilled") setMyTeams(teams.value.data.data || []);
    if (res.status === "fulfilled") setFinalResults(res.value.data.data || []);
    if (chs.status === "fulfilled") setClusterInfo(chs.value.data.data || []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filter final results for my teams only
  const myTeamNames = myTeams.map((t: any) => t.name);
  const myFinalResults = finalResults.filter((r: any) => myTeamNames.includes(r.teamName));

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
        {/* ── OVERVIEW ───────────────────────────────────── */}
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Users, label: "My Assigned Teams", value: myTeams.length, color: "bg-teal-500" },
                { icon: UserCheck, label: "Total Members", value: myTeams.reduce((a, t) => a + (t.memberCount || 0), 0), color: "bg-indigo-500" },
                { icon: Trophy, label: "Teams Passed", value: myFinalResults.length, color: "bg-green-500" },
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

            {/* Teams summary with member details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-500" />My Assigned Teams &amp; Members
              </h2>
              {myTeams.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No teams assigned to you yet. Your Cluster Head will assign teams to you.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myTeams.map(t => (
                    <div key={t.id} className="rounded-2xl bg-white border border-gray-200 hover:border-teal-300 transition-all p-5 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 text-base">{t.name}</p>
                          <p className="text-xs text-teal-700 font-medium">{t.sectionName}</p>
                        </div>
                        <span className="text-xs bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full font-semibold">
                          {t.memberCount} members
                        </span>
                      </div>

                      {/* Member list preview */}
                      <div className="border-t border-gray-100 pt-3 space-y-1.5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Members</p>
                        {t.members && t.members.length > 0 ? (
                          <div className="space-y-1">
                            {t.members.map((m: any, idx: number) => (
                              <div key={m.id || idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50">
                                <span className="font-medium text-gray-800 flex items-center gap-1.5 truncate">
                                  {m.isLeader ? <Shield className="w-3 h-3 text-amber-500 shrink-0" /> : <UserCheck className="w-3 h-3 text-gray-400 shrink-0" />}
                                  {m.name || `${m.firstName} ${m.lastName}`}
                                </span>
                                {m.rollNumber && <span className="text-gray-400 text-[10px] shrink-0">{m.rollNumber}</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No members added yet</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── MY TEAMS ────────────────────────────────────── */}
        {tab === "teams" && (
          <TeamsManagementPanel myTeams={myTeams} onRefresh={fetchAll} />
        )}

        {/* ── CLUSTER HEADS ───────────────────────────────── */}
        {tab === "cluster-heads" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Cluster &amp; Cluster Head Details</h2>
              <p className="text-gray-500 text-sm mt-0.5">The Cluster and Cluster Head who assigned your mentor account to these teams.</p>
            </div>
            <MentorClusterHeads clusterInfo={clusterInfo} />
          </motion.div>
        )}

        {/* ── VERSIONS ────────────────────────────────────── */}
        {tab === "versions" && (
          <VersionsPanel myTeams={myTeams} onResultsChange={fetchAll} finalResults={finalResults} />
        )}

        {/* ── FINAL RESULTS ───────────────────────────────── */}
        {tab === "results" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Final Results</h2>
            {myFinalResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <Trophy className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No approved final papers yet.</p>
                <p className="text-gray-400 text-xs mt-1">Teams that pass Version review will appear here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Team Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Section</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cluster</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paper Name</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Version Passed</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Plagiarism %</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">AI Content %</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myFinalResults.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900 text-sm">{r.teamName}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{r.sectionName}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{r.clusterName || "—"}</td>
                        <td className="px-6 py-4 text-gray-700 text-sm font-medium">{r.paperName || "Project Paper"}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold">
                            v{r.versionPassed}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-teal-700">
                          {r.plagiarismPercent ?? 0}%
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-purple-700">
                          {r.aiContentPercent ?? 0}%
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                            <CheckCircle className="w-3.5 h-3.5" /> Passed
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

// ─────────────────────────────────────────────────────────────────────────────
// TEAMS MANAGEMENT PANEL (Team leader creation, member addition, member deletion)
// ─────────────────────────────────────────────────────────────────────────────
function TeamsManagementPanel({ myTeams, onRefresh }: { myTeams: any[]; onRefresh: () => void }) {
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState("");

  const [showLeaderForm, setShowLeaderForm] = useState(false);
  const [leaderForm, setLeaderForm] = useState({ firstName: "", lastName: "", email: "", password: "", rollNumber: "" });
  const [creatingLeader, setCreatingLeader] = useState(false);
  const [leaderError, setLeaderError] = useState("");

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberForm, setMemberForm] = useState({ firstName: "", lastName: "", rollNumber: "" });
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  useEffect(() => {
    if (myTeams.length > 0 && !selectedTeam) {
      selectTeam(myTeams[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTeams]);

  const selectTeam = async (team: any) => {
    setSelectedTeam(team);
    setError("");
    setShowLeaderForm(false);
    setShowMemberForm(false);
    setLoadingMembers(true);
    try {
      const res = await api.get(`/mentor/teams/${team.id}/members`);
      setMembers(res.data.data || []);
    } catch {
      setMembers(team.members || []);
    }
    setLoadingMembers(false);
  };

  const createLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setCreatingLeader(true); setLeaderError("");
    try {
      const res = await api.post(`/mentor/teams/${selectedTeam.id}/create-leader`, leaderForm);
      setMembers(prev => [res.data.data, ...prev]);
      setShowLeaderForm(false);
      setLeaderForm({ firstName: "", lastName: "", email: "", password: "", rollNumber: "" });
      onRefresh();
    } catch (e: any) {
      setLeaderError(e.response?.data?.message || "Failed to create leader");
    }
    setCreatingLeader(false);
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setAddingMember(true); setMemberError("");
    try {
      const res = await api.post(`/mentor/teams/${selectedTeam.id}/members`, memberForm);
      setMembers(prev => [...prev, res.data.data]);
      setShowMemberForm(false);
      setMemberForm({ firstName: "", lastName: "", rollNumber: "" });
      onRefresh();
    } catch (e: any) {
      setMemberError(e.response?.data?.message || "Failed to add member");
    }
    setAddingMember(false);
  };

  const removeMember = async (memberId: number) => {
    if (!window.confirm("Remove this member from the team?")) return;
    try {
      await api.delete(`/mentor/teams/${selectedTeam.id}/members/${memberId}`);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      onRefresh();
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to remove member");
    }
  };

  const hasLeader = members.some(m => m.isLeader);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">My Teams</h2>
        <p className="text-gray-500 text-sm mt-0.5">Teams assigned by your Cluster Head. Add members and create student credentials for Team Leader.</p>
      </div>

      {myTeams.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">No teams assigned yet.</p>
          <p className="text-gray-400 text-sm mt-1">Your Cluster Head will assign teams to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Teams list */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Team</p>
            {myTeams.map(team => {
              const active = selectedTeam?.id === team.id;
              return (
                <button
                  key={team.id}
                  onClick={() => selectTeam(team)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                    active
                      ? "border-teal-600 bg-teal-50 shadow-sm"
                      : "border-gray-100 bg-white hover:border-teal-200"
                  }`}
                >
                  <div>
                    <p className={`font-bold text-sm ${active ? "text-teal-900" : "text-gray-800"}`}>{team.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{team.sectionName}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${active ? "bg-teal-200 text-teal-800" : "bg-gray-100 text-gray-600"}`}>
                    {team.memberCount} members
                  </span>
                </button>
              );
            })}
          </div>

          {/* Members management */}
          <div className="lg:col-span-2">
            {selectedTeam && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{selectedTeam.name}</h3>
                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">{selectedTeam.sectionName}</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">Manage team members and leader credentials</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!hasLeader && (
                      <button
                        onClick={() => { setShowLeaderForm(p => !p); setShowMemberForm(false); }}
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-all shadow-sm"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        + Create Leader Login
                      </button>
                    )}
                    <button
                      onClick={() => { setShowMemberForm(p => !p); setShowLeaderForm(false); }}
                      className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-all shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      + Add Member
                    </button>
                  </div>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs">{error}</div>}

                {/* CREATE LEADER FORM */}
                <AnimatePresence>
                  {showLeaderForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={createLeader}
                      className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-4"
                    >
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                        <Shield className="w-4 h-4 text-amber-600" />
                        Create Team Leader Login (Credentials for Student Portal)
                      </div>
                      <p className="text-xs text-amber-700">Creates a login account so the Team Leader can sign in and submit papers.</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                          <input required type="text" placeholder="e.g. John" value={leaderForm.firstName}
                            onChange={e => setLeaderForm({ ...leaderForm, firstName: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                          <input type="text" placeholder="e.g. Doe" value={leaderForm.lastName}
                            onChange={e => setLeaderForm({ ...leaderForm, lastName: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Student Login) *</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <input required type="email" placeholder="leader@student.edu" value={leaderForm.email}
                              onChange={e => setLeaderForm({ ...leaderForm, email: e.target.value })}
                              className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
                          <div className="relative">
                            <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <input required type="password" placeholder="Min. 6 chars" value={leaderForm.password}
                              onChange={e => setLeaderForm({ ...leaderForm, password: e.target.value })}
                              className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white" />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Roll / Reg Number</label>
                          <input type="text" placeholder="e.g. 21BCE1001" value={leaderForm.rollNumber}
                            onChange={e => setLeaderForm({ ...leaderForm, rollNumber: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white" />
                        </div>
                      </div>

                      {leaderError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{leaderError}</div>}

                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowLeaderForm(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                        <button type="submit" disabled={creatingLeader} className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all disabled:opacity-50">
                          {creatingLeader ? "Creating..." : "Create Leader & Account"}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* ADD PLAIN MEMBER FORM */}
                <AnimatePresence>
                  {showMemberForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={addMember}
                      className="p-5 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-4"
                    >
                      <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                        <UserPlus className="w-4 h-4 text-teal-600" />
                        Add Team Member (Name &amp; Roll Number Only — No Login Required)
                      </div>
                      <p className="text-xs text-teal-700">Enter student details for record keeping. Only team leader needs credentials.</p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                          <input required type="text" placeholder="e.g. Sarah" value={memberForm.firstName}
                            onChange={e => setMemberForm({ ...memberForm, firstName: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                          <input type="text" placeholder="e.g. Connor" value={memberForm.lastName}
                            onChange={e => setMemberForm({ ...memberForm, lastName: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Roll / Reg Number</label>
                          <input type="text" placeholder="e.g. 21BCE1002" value={memberForm.rollNumber}
                            onChange={e => setMemberForm({ ...memberForm, rollNumber: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white" />
                        </div>
                      </div>

                      {memberError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{memberError}</div>}

                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowMemberForm(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                        <button type="submit" disabled={addingMember} className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all disabled:opacity-50">
                          {addingMember ? "Adding..." : "Add Member"}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* MEMBERS LIST */}
                {loadingMembers ? (
                  <div className="text-center py-10 text-gray-400">Loading members...</div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                    <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-semibold text-sm">No members in this team yet</p>
                    <p className="text-gray-400 text-xs mt-1">Start by clicking "+ Create Leader Login" above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Team Members ({members.length})</p>
                    {members.map(member => (
                      <div key={member.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3 hover:bg-gray-100/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${member.isLeader ? "bg-amber-500 text-white" : "bg-teal-500 text-white"}`}>
                            {member.name?.[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 text-sm">{member.name}</p>
                              {member.isLeader ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                                  <Shield className="w-2.5 h-2.5" /> Leader
                                </span>
                              ) : (
                                <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">Member</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                              {member.email && !member.email.includes("placeholder.internal") && (
                                <span className="flex items-center gap-1 font-mono text-[11px]"><Mail className="w-3 h-3 text-gray-400" />{member.email}</span>
                              )}
                              {member.rollNumber && <span>Roll: <strong className="text-gray-700">{member.rollNumber}</strong></span>}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removeMember(member.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MENTOR CLUSTER HEADS
// ─────────────────────────────────────────────────────────────────────────────
function MentorClusterHeads({ clusterInfo }: { clusterInfo: any[] }) {
  if (clusterInfo.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
      <Contact2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">No Cluster Head assigned yet.</p>
      <p className="text-gray-400 text-xs mt-1">When a Cluster Head assigns you to a team, their cluster details will display here.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {clusterInfo.map(ch => (
        <div key={ch.clusterId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {ch.clusterHeadName?.[0] || "C"}
              </div>
              <div>
                <span className="text-xs bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Cluster: {ch.clusterName}
                </span>
                <h3 className="font-bold text-gray-900 text-lg mt-1">{ch.clusterHeadName || "Cluster Head"}</h3>
                <p className="text-xs text-gray-500">{ch.clusterHeadEmail}</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {ch.clusterHeadPhone && (
              <p className="text-xs text-gray-600">Contact: <strong className="text-gray-800">{ch.clusterHeadPhone}</strong></p>
            )}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Your Assigned Teams in this Cluster ({ch.assignedTeams?.length || 0})
              </p>
              <div className="flex flex-wrap gap-2">
                {ch.assignedTeams && ch.assignedTeams.length > 0 ? (
                  ch.assignedTeams.map((name: string) => (
                    <span key={name} className="bg-teal-50 border border-teal-200 text-teal-800 text-xs px-3 py-1.5 rounded-xl font-bold">
                      {name}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No specific teams recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VERSIONS PANEL — simplified: checkbox per team → passed/not passed
// ─────────────────────────────────────────────────────────────────────────────
function VersionsPanel({ myTeams, onResultsChange, finalResults }: {
  myTeams: any[]; onResultsChange: () => void; finalResults: any[];
}) {
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [curVer, setCurVer] = useState(1);

  // Passed teams from final results
  const passedTeamNames = finalResults.map((r: any) => r.teamName);
  const remainingTeams = myTeams.filter(t => !passedTeamNames.includes(t.name));

  const toggle = (id: number) => setCheckedIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const submitVersion = async () => {
    if (remainingTeams.length === 0) return;
    setSubmitting(true);
    try {
      // Group remaining teams by their sectionId
      const bySection = new Map<number, any[]>();
      for (const t of remainingTeams) {
        if (!bySection.has(t.sectionId)) bySection.set(t.sectionId, []);
        bySection.get(t.sectionId)!.push(t);
      }

      for (const [secId, secTeams] of bySection.entries()) {
        if (!secId) continue;
        // Create version session if none exists
        try { await api.post(`/sections/${secId}/versions/create`); } catch { /* ignore if already open */ }
        const vsRes = await api.get(`/sections/${secId}/versions`);
        const openVS = (vsRes.data.data || []).find((v: any) => v.status === "OPEN");
        if (!openVS) continue;

        const evals = secTeams.map((t: any) => ({
          teamId: t.id,
          passed: checkedIds.has(t.id),
        }));

        await api.post(`/sections/versions/${openVS.id}/evaluate`, { evaluations: evals });
      }

      onResultsChange();
      setCurVer(v => v + 1);
      setCheckedIds(new Set());
      alert(`Version ${curVer} completed! Checked teams added to Final Results.`);
    } catch (e: any) {
      alert(e.response?.data?.message || "Error completing version");
    }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Version Review</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Check the teams that have passed this version. Unchecked teams automatically move to Version {curVer + 1}.
        </p>
      </div>

      {remainingTeams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Trophy className="w-14 h-14 text-green-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-lg">All your teams have passed!</h3>
          <p className="text-gray-500 text-sm mt-1">All assigned teams have completed paper evaluation.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-teal-100 shadow-sm p-6 relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-t-2xl" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Version {curVer} Evaluation</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                Checked teams will pass to Final Results. Unchecked teams move to Version {curVer + 1}.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
                {checkedIds.size} Passing
              </span>
              <span className="px-3 py-1.5 bg-red-100 text-red-600 rounded-full">
                {remainingTeams.length - checkedIds.size} Move to Next
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {remainingTeams.map((t: any) => {
              const checked = checkedIds.has(t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={`rounded-xl border-2 transition-all p-4 cursor-pointer select-none flex items-center gap-4 ${
                    checked ? "border-green-500 bg-green-50 shadow-sm" : "border-gray-200 bg-white hover:border-teal-300"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    checked ? "border-green-500 bg-green-500 text-white" : "border-gray-300 bg-white"
                  }`}>
                    {checked && <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.sectionName} · {t.memberCount} members</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0 ${
                    checked ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    {checked ? <><CheckCircle className="w-3 h-3" />Pass v{curVer}</> : <><XCircle className="w-3 h-3" />Next v{curVer + 1}</>}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={submitVersion}
            disabled={submitting}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            Complete Version {curVer} &amp; Approve Checked Teams
          </button>
        </div>
      )}
    </motion.div>
  );
}

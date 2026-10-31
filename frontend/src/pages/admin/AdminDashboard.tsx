import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Users, Layers, BookOpen, UserCheck, Shield, ChevronDown, ChevronRight, CheckCircle, XCircle, Trophy, FileText, Pencil, Trash2, Search, Filter
} from "lucide-react";

type Tab = "overview" | "sections" | "clusters" | "mentors" | "final-papers" | "results" | "versions";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const tab = (urlTab as Tab) || "overview";

  const [stats, setStats] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [finalResults, setFinalResults] = useState<any[]>([]);
  const [loadError, setLoadError] = useState("");

  const fetchClusters = useCallback(async () => {
    const response = await api.get("/admin/clusters");
    setClusters(response.data.data || []);
    setLoadError("");
  }, []);

  const fetchAll = useCallback(async () => {
    if (tab === "clusters") {
      try { await fetchClusters(); } catch (error: any) {
        setLoadError(error.response?.data?.message || "Could not load clusters.");
      }
      return;
    }
    const [dash, sec, userRes, clusterRes, finalRes] = await Promise.allSettled([
      api.get("/admin/dashboard"),
      api.get("/sections"),
      api.get("/admin/users?role=MENTOR"),
      api.get("/admin/clusters"),
      api.get("/sections/final-results")
    ]);
    if (dash.status === "fulfilled") setStats(dash.value.data.data);
    if (sec.status === "fulfilled") setSections(sec.value.data.data || []);
    if (userRes.status === "fulfilled") setMentors(userRes.value.data.data || []);
    if (clusterRes.status === "fulfilled") {
      setClusters(clusterRes.value.data.data || []);
      setLoadError("");
    } else {
      setLoadError(clusterRes.reason?.response?.data?.message || "Could not load clusters. Please sign in again.");
    }
    if (finalRes.status === "fulfilled") {
      setFinalResults(finalRes.value.data.data || []);
    }
  }, [fetchClusters, tab]);

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
        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
        {tab === "overview" && stats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Total Students", value: stats.totalStudents, icon: Users, color: "bg-blue-500" },
                { label: "Total Mentors", value: stats.totalMentors, icon: UserCheck, color: "bg-indigo-500" },
                { label: "Cluster Heads", value: stats.totalClusterHeads, icon: Layers, color: "bg-teal-500" },
                { label: "Total Sections", value: sections.length, icon: BookOpen, color: "bg-purple-500" },
                { label: "Papers Passed", value: finalResults.length, icon: Trophy, color: "bg-green-500" },
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-500" />Cluster Setup
                </h2>
                <a href="/admin/clusters" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Manage clusters</a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clusters.slice(0, 6).map(cluster => (
                  <div key={cluster.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900">{cluster.name}</p>
                      <span className="text-xs text-gray-500">{cluster.sections.length} sections</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {cluster.clusterHead ? `${cluster.clusterHead.firstName} ${cluster.clusterHead.lastName}` : "Cluster Head not assigned"}
                    </p>
                  </div>
                ))}
                {clusters.length === 0 && <p className="text-sm text-gray-500">No clusters configured yet.</p>}
              </div>
            </div>

            {finalResults.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />Recent Passed Papers
                  </h2>
                  <a href="/admin/results" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                    View all ({finalResults.length})
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {finalResults.slice(0, 3).map(r => (
                    <div key={r.id} className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-900">{r.teamName}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">v{r.versionPassed} Passed</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Section: <span className="font-semibold text-gray-700">{r.sectionName}</span> · Cluster: <span className="font-semibold text-gray-700">{r.clusterName}</span>
                      </p>
                      {r.mentorName && r.mentorName !== "-" && (
                        <p className="text-xs text-gray-400 mt-0.5">Mentor: {r.mentorName}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === "sections" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">All Sections</h2>
            {sections.map(s => <SectionCard key={s.id} section={s} expanded />)}
          </motion.div>
        )}

        {tab === "clusters" && <ClusterManagement clusters={clusters} onChanged={fetchClusters} />}

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

        {(tab === "results" || tab === "final-papers") && (
          <FinalResultsPanel
            finalResults={finalResults}
            clusters={clusters}
            sections={sections}
          />
        )}

        {tab === "versions" && (
          <VersionsPanel
            sections={sections}
            onResultsChange={fetchAll}
            finalResults={finalResults}
          />
        )}
      </div>
    </div>
  );
}

function ClusterManagement({ clusters, onChanged }: { clusters: any[]; onChanged: () => void }) {
  const [clusterName, setClusterName] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [account, setAccount] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [sectionName, setSectionName] = useState("");
  const [accountType, setAccountType] = useState<"cluster-head" | "guides">("cluster-head");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const activeCluster = clusters.find(cluster => cluster.id === selected) || null;
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [createDialog, setCreateDialog] = useState<"cluster" | "section" | "account" | null>(null);

  const runAction = async (action: () => Promise<void>, message: string) => {
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
      await onChanged();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "The operation failed. Please try again.");
    }
  };

  const submitCluster = async (event: React.FormEvent) => {
    event.preventDefault();
    await runAction(async () => {
      await api.post("/admin/clusters", { name: clusterName });
      setClusterName("");
    }, "Cluster created successfully.");
  };

  const submitSection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selected === null) return;
    await runAction(async () => {
      await api.post(`/admin/clusters/${selected}/sections`, { name: sectionName });
      setSectionName("");
    }, "Section added successfully.");
  };

  const submitAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selected === null) return;
    await runAction(async () => {
      await api.post(`/admin/clusters/${selected}/${accountType}`, account);
      setAccount({ firstName: "", lastName: "", email: "", password: "" });
    }, `${accountType === "guides" ? "Guide" : "Cluster Head"} account created successfully.`);
  };

  const editCluster = async (cluster: any) => {
    const name = window.prompt("Cluster name", cluster.name)?.trim();
    if (!name || name === cluster.name) return;
    await runAction(() => api.put(`/admin/clusters/${cluster.id}`, { name }).then(() => undefined), "Cluster updated successfully.");
  };

  const removeCluster = async (cluster: any) => {
    if (!window.confirm(`Delete ${cluster.name}? It must have no sections.`)) return;
    await runAction(() => api.delete(`/admin/clusters/${cluster.id}`).then(() => undefined), "Cluster deleted successfully.");
    if (selected === cluster.id) setSelected(null);
  };

  const editSection = async (cluster: any, section: any) => {
    const name = window.prompt("Section name", section.name)?.trim();
    if (!name || name === section.name) return;
    await runAction(() => api.put(`/admin/clusters/${cluster.id}/sections/${section.id}`, { name }).then(() => undefined), "Section updated successfully.");
  };

  const removeSection = async (cluster: any, section: any) => {
    if (!window.confirm(`Delete ${section.name}?`)) return;
    await runAction(() => api.delete(`/admin/clusters/${cluster.id}/sections/${section.id}`).then(() => undefined), "Section deleted successfully.");
  };

  const editAccount = async (accountToEdit: any) => {
    const firstName = window.prompt("First name", accountToEdit.firstName)?.trim();
    const lastName = window.prompt("Last name", accountToEdit.lastName)?.trim();
    const email = window.prompt("Email", accountToEdit.email)?.trim();
    if (!firstName || !lastName || !email) return;
    await runAction(() => api.put(`/admin/users/${accountToEdit.id}`, { firstName, lastName, email }).then(() => undefined), "Account updated successfully.");
  };

  const removeAccount = async (accountToRemove: any) => {
    if (!window.confirm(`Deactivate ${accountToRemove.firstName} ${accountToRemove.lastName}?`)) return;
    await runAction(() => api.delete(`/admin/users/${accountToRemove.id}`).then(() => undefined), "Account deactivated successfully.");
  };

  const openCreate = (type: "cluster" | "section" | "account") => {
    setNewMenuOpen(false);
    setCreateDialog(type);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Administration</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Clusters & accounts</h2>
          <p className="mt-1 text-sm text-gray-500">Organize your academic workspace.</p>
        </div>
        <div className="hidden rounded-xl border border-gray-200 bg-white px-3 py-2 text-right sm:block">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Total clusters</p>
          <p className="text-lg font-semibold text-gray-900">{clusters.length}</p>
        </div>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}
      <div className="relative z-20 flex min-h-14 items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <button type="button" onClick={() => setSelected(null)} className="font-semibold text-indigo-600 hover:text-indigo-800">ProjectFlow</button>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          {activeCluster ? (
            <>
              <button type="button" onClick={() => setSelected(null)} className="font-semibold text-indigo-600 hover:text-indigo-800">Clusters</button>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="truncate font-bold text-gray-900">{activeCluster.name}</span>
            </>
          ) : <span className="font-bold text-gray-900">Clusters</span>}
        </div>
        <div className="relative">
          <button type="button" onClick={() => setNewMenuOpen(!newMenuOpen)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md">
            <span className="text-lg leading-none">+</span> New
          </button>
          {newMenuOpen && (
            <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl">
              {!activeCluster && <button type="button" onClick={() => openCreate("cluster")} className="block w-full rounded-xl px-4 py-2.5 text-left text-sm hover:bg-indigo-50">New cluster</button>}
              {activeCluster && <>
                <button type="button" onClick={() => openCreate("section")} className="block w-full rounded-xl px-4 py-2.5 text-left text-sm hover:bg-indigo-50">New section</button>
                <button type="button" onClick={() => { setAccountType("guides"); openCreate("account"); }} className="block w-full rounded-xl px-4 py-2.5 text-left text-sm hover:bg-indigo-50">New mentor / guide</button>
                {!activeCluster.clusterHead && <button type="button" onClick={() => { setAccountType("cluster-head"); openCreate("account"); }} className="block w-full rounded-xl px-4 py-2.5 text-left text-sm hover:bg-indigo-50">New Cluster Head</button>}
              </>}
            </div>
          )}
        </div>
      </div>
      {!activeCluster ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Project workspace</p>
              <h3 className="mt-1 text-lg font-semibold text-gray-900">All clusters</h3>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">{clusters.length} items</span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {clusters.map(cluster => (
              <div key={cluster.id} onClick={() => setSelected(cluster.id)}
                className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={e => { e.stopPropagation(); editCluster(cluster); }} className="rounded-lg bg-white p-2 text-gray-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={e => { e.stopPropagation(); removeCluster(cluster); }} className="rounded-lg bg-white p-2 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <h4 className="truncate text-base font-semibold text-gray-900">{cluster.name}</h4>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
                </div>
                <p className="mt-1 text-sm text-gray-500">Open cluster workspace</p>
                <div className="mt-5 flex gap-2 text-xs font-semibold text-gray-600">
                  <span className="rounded-md bg-gray-100 px-2.5 py-1.5">{cluster.sections.length} sections</span>
                  <span className="rounded-md bg-gray-100 px-2.5 py-1.5">{cluster.guides.length} mentors</span>
                </div>
              </div>
            ))}
          </div>
          {clusters.length === 0 && <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500">No clusters yet. Create the first cluster above.</div>}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2 text-sm">
              <button type="button" onClick={() => setSelected(null)} className="font-semibold text-indigo-600 hover:text-indigo-800">All clusters</button>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="font-bold text-gray-900">{activeCluster.name}</span>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Back</button>
          </div>
          <div className="bg-gray-900 px-6 py-6 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10"><Layers className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-indigo-100">Cluster workspace</p>
                <h3 className="text-xl font-semibold">{activeCluster.name}</h3>
              </div>
            </div>
          </div>
          <div className="grid gap-6 p-6 lg:grid-cols-2">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Cluster Head</p>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-600">1 maximum</span>
            </div>
              {activeCluster.clusterHead ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                    {activeCluster.clusterHead.firstName[0]}{activeCluster.clusterHead.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{activeCluster.clusterHead.firstName} {activeCluster.clusterHead.lastName}</p>
                    <p className="text-xs text-gray-500">{activeCluster.clusterHead.email}</p>
                  </div>
                  <button type="button" onClick={() => editAccount(activeCluster.clusterHead)}><Pencil className="h-4 w-4 text-gray-400 hover:text-indigo-600" /></button>
                  <button type="button" onClick={() => removeAccount(activeCluster.clusterHead)}><Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" /></button>
                </div>
              ) : <p className="mt-2 text-sm text-gray-500">No Cluster Head assigned. Use <span className="font-semibold text-indigo-600">+ New → New Cluster Head</span> to add one.</p>}
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between"><h4 className="font-bold text-gray-900">Sections</h4><span className="text-sm text-gray-500">{activeCluster.sections.length}</span></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {activeCluster.sections.map((section: any) => (
                  <div key={section.id} className="group rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between"><BookOpen className="h-5 w-5 text-purple-600" /><span className="flex gap-1 opacity-0 group-hover:opacity-100"><button type="button" onClick={() => editSection(activeCluster, section)}><Pencil className="h-3 w-3 text-gray-500" /></button><button type="button" onClick={() => removeSection(activeCluster, section)}><Trash2 className="h-3 w-3 text-red-500" /></button></span></div>
                    <p className="mt-3 font-bold text-gray-800">{section.name}</p>
                  </div>
                ))}
                {activeCluster.sections.length === 0 && <p className="col-span-full rounded-xl border border-dashed p-6 text-center text-sm text-gray-400">No sections yet.</p>}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between"><h4 className="font-bold text-gray-900">Mentors / Guides</h4><span className="text-sm text-gray-500">{activeCluster.guides.length}</span></div>
              <div className="space-y-2">
                {activeCluster.guides.map((guide: any) => <div key={guide.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">{guide.firstName[0]}{guide.lastName[0]}</div><div><p className="text-sm font-semibold">{guide.firstName} {guide.lastName}</p><p className="text-xs text-gray-500">{guide.email}</p></div></div><span className="flex gap-2"><button type="button" onClick={() => editAccount(guide)}><Pencil className="h-4 w-4 text-gray-400 hover:text-indigo-600" /></button><button type="button" onClick={() => removeAccount(guide)}><Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" /></button></span></div>)}
                {activeCluster.guides.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-400">No mentors yet.</p>}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {createDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={() => setCreateDialog(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
            {createDialog === "cluster" && (
              <form onSubmit={async event => { await submitCluster(event); setCreateDialog(null); }} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">New cluster</h3>
                <input autoFocus required value={clusterName} onChange={e => setClusterName(e.target.value)} placeholder="Cluster name" className="w-full rounded-xl border px-3 py-2.5" />
                <div className="flex justify-end gap-2"><button type="button" onClick={() => setCreateDialog(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button><button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Create</button></div>
              </form>
            )}
            {createDialog === "section" && (
              <form onSubmit={async event => { await submitSection(event); setCreateDialog(null); }} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">New section in {activeCluster?.name}</h3>
                <input autoFocus required value={sectionName} onChange={e => setSectionName(e.target.value)} placeholder="Section A" className="w-full rounded-xl border px-3 py-2.5" />
                <div className="flex justify-end gap-2"><button type="button" onClick={() => setCreateDialog(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button><button className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white">Create</button></div>
              </form>
            )}
            {createDialog === "account" && (
              <form onSubmit={async event => { await submitAccount(event); setCreateDialog(null); }} className="space-y-3">
                <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-gray-900">New {accountType === "guides" ? "mentor / guide" : "Cluster Head"}</h3><button type="button" onClick={() => setCreateDialog(null)} className="text-gray-400">×</button></div>
                <div className="grid grid-cols-2 gap-2"><input autoFocus required value={account.firstName} onChange={e => setAccount({ ...account, firstName: e.target.value })} placeholder="First name" className="rounded-xl border px-3 py-2.5" /><input required value={account.lastName} onChange={e => setAccount({ ...account, lastName: e.target.value })} placeholder="Last name" className="rounded-xl border px-3 py-2.5" /></div>
                <input required type="email" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} placeholder="Email" className="w-full rounded-xl border px-3 py-2.5" />
                <input required type="password" minLength={8} value={account.password} onChange={e => setAccount({ ...account, password: e.target.value })} placeholder="Temporary password" className="w-full rounded-xl border px-3 py-2.5" />
                <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setCreateDialog(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button><button className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Create</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </motion.div>
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

function FinalResultsPanel({
  finalResults,
  clusters,
  sections,
}: {
  finalResults: any[];
  clusters: any[];
  sections: any[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("ALL");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");

  // Derive filter options
  const clusterNames = Array.from(new Set(finalResults.map(r => r.clusterName).filter(Boolean)));
  const sectionNames = Array.from(new Set(finalResults.map(r => r.sectionName).filter(Boolean)));

  const filtered = finalResults.filter((r: any) => {
    const matchesSearch =
      !search ||
      (r.teamName && r.teamName.toLowerCase().includes(search.toLowerCase())) ||
      (r.sectionName && r.sectionName.toLowerCase().includes(search.toLowerCase())) ||
      (r.clusterName && r.clusterName.toLowerCase().includes(search.toLowerCase())) ||
      (r.mentorName && r.mentorName.toLowerCase().includes(search.toLowerCase())) ||
      (r.paperName && r.paperName.toLowerCase().includes(search.toLowerCase()));

    const matchesCluster = selectedCluster === "ALL" || r.clusterName === selectedCluster;
    const matchesSection = selectedSection === "ALL" || r.sectionName === selectedSection;

    return matchesSearch && matchesCluster && matchesSection;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Final Results & Passed Papers
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Complete records of all approved teams, sections, clusters, and assigned mentors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-600" />
            {finalResults.length} Teams Approved
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by section, team, cluster, mentor, or paper..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={selectedCluster}
            onChange={e => setSelectedCluster(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Clusters</option>
            {clusterNames.map(cn => (
              <option key={cn} value={cn}>{cn}</option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Sections</option>
            {sectionNames.map(sn => (
              <option key={sn} value={sn}>{sn}</option>
            ))}
          </select>

          {(search || selectedCluster !== "ALL" || selectedSection !== "ALL") && (
            <button
              onClick={() => { setSearch(""); setSelectedCluster("ALL"); setSelectedSection("ALL"); }}
              className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results Table or Empty State */}
      {finalResults.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <Trophy className="w-16 h-16 text-amber-200 mx-auto mb-4" />
          <p className="text-gray-800 font-bold text-lg">No approved final papers yet</p>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            Teams that successfully pass version evaluation in the Mentor or Cluster Head portals will appear here automatically.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-gray-500 font-medium">No results match your filters.</p>
          <button
            onClick={() => { setSearch(""); setSelectedCluster("ALL"); setSelectedSection("ALL"); }}
            className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Team Name</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Cluster</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Mentor</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Paper</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Plagiarism</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">AI Content</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Section */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        {r.sectionName}
                      </span>
                    </td>

                    {/* Team Name */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{r.teamName}</p>
                        {r.teamMembers && r.teamMembers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.teamMembers.slice(0, 3).map((m: string, idx: number) => (
                              <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">
                                {m}
                              </span>
                            ))}
                            {r.teamMembers.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{r.teamMembers.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cluster Name */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        {r.clusterName || "—"}
                      </span>
                    </td>

                    {/* Mentor Name */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 font-medium flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        {r.mentorName && r.mentorName !== "-" ? r.mentorName : <span className="text-gray-400 italic">Not Assigned</span>}
                      </span>
                    </td>

                    {/* Paper Name */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-medium flex items-center gap-1.5 max-w-[200px] truncate" title={r.paperName}>
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {r.paperName || "Project Paper"}
                      </span>
                    </td>

                    {/* Version Passed */}
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold">
                        v{r.versionPassed}
                      </span>
                    </td>

                    {/* Plagiarism % */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        {r.plagiarismPercent ?? 0}%
                      </span>
                    </td>

                    {/* AI Content % */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {r.aiContentPercent ?? 0}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold inline-flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Passed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
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
      let openVS: any = null;
      try {
        const createRes = await api.post(`/sections/${sel.id}/versions/create`);
        openVS = createRes.data.data;
      } catch (err: any) {
        // Version session might already exist as OPEN
      }
      if (!openVS) {
        const vsRes = await api.get(`/sections/${sel.id}/versions`);
        openVS = (vsRes.data.data || []).find((v: any) => v.status === "OPEN");
      }
      if (!openVS) {
        alert("Could not open a version for evaluation.");
        setSubmitting(false);
        return;
      }

      const evals = remainingTeams.map((t: any) => ({
        teamId: t.id,
        passed: checkedIds.has(t.id),
      }));

      await api.post(`/sections/versions/${openVS.id}/evaluate`, { evaluations: evals });
      onResultsChange();
      await loadSec(sel);
      setCheckedIds(new Set());
      alert(`Version evaluated successfully! Checked teams added to Final Results.`);
    } catch (e: any) {
      alert(e.response?.data?.message || "Error completing evaluation");
    }
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

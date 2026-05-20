"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, GitMerge, Check, X, CheckCircle2, Clock, Users, ArrowRightLeft, FileWarning, Eye, AlertCircle, RefreshCw, LayoutDashboard, Fingerprint, Database, Server, ArrowLeft } from "lucide-react"
import Link from "next/link"

const MOCK_CONFLICTS = [
    {
        id: "conf_001",
        type: "Assessment Data Merge",
        entity: "TechNova Solutions - Q3 Audit",
        timestamp: "10 mins ago",
        severity: "high",
        left: {
            title: "Client Submission",
            author: "jane.doe@technova.com",
            data: {
                "Multi-Factor Authentication (MFA)": "Enabled for ALL users",
                "Password Policy": "90 Days Expiration",
                "EDR Deployment": "Partial (75%)"
            }
        },
        right: {
            title: "Auditor Override",
            author: "risk.team@shareindia.com",
            data: {
                "Multi-Factor Authentication (MFA)": "Exception granted for legacy servers",
                "Password Policy": "30 Days Expiration",
                "EDR Deployment": "Full (100%)"
            }
        }
    },
    {
        id: "conf_002",
        type: "Risk Profile Config",
        entity: "Manufacturing Sector Weights",
        timestamp: "2 hours ago",
        severity: "medium",
        left: {
            title: "Current Production",
            author: "System Default",
            data: {
                "Endpoint Security Weight": "1.5x",
                "Killer Control: Legacy OS": "Warning Only",
            }
        },
        right: {
            title: "Staged Configuration",
            author: "admin.override@shareindia.com",
            data: {
                "Endpoint Security Weight": "2.0x",
                "Killer Control: Legacy OS": "Auto-Decline",
            }
        }
    }
]

const MOCK_ACCESS_REQUESTS = [
    { id: 'req_01', name: 'Robert Chen', role: 'Underwriter', email: 'robert.c@shareindia.com', status: 'Pending', time: '1 hr ago' },
    { id: 'req_02', name: 'Sarah Jenkins', role: 'Risk Analyst', email: 's.jenkins@shareindia.com', status: 'Pending', time: '3 hrs ago' }
]

const INITIAL_SYSTEM_HEALTH = [
    { id: 'db', name: 'Database Sync', status: 'Operational', currentLatency: 24, icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'scoring', name: 'Scoring Engine Node', status: 'Optimal', currentLatency: 12, icon: Server, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'auth', name: 'Auth Server', status: 'Warning', currentLatency: 450, icon: Fingerprint, color: 'text-si-red', bg: 'bg-si-red/10' }
]

export default function AdminApprovalsPage() {
    const [activeTab, setActiveTab] = useState<'conflicts' | 'access' | 'health'>('conflicts')
    const [resolvedConflicts, setResolvedConflicts] = useState<string[]>([])
    const [healthMetrics, setHealthMetrics] = useState(INITIAL_SYSTEM_HEALTH)

    useEffect(() => {
        if (activeTab !== 'health') return;

        const fetchHealth = async () => {
            try {
                const res = await fetch('/api/health', { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();

                setHealthMetrics(prev => prev.map(sys => {
                    // Update the state using the real backend data directly matching system ids
                    switch (sys.id) {
                        case 'db': return { ...sys, currentLatency: data.db?.latency || sys.currentLatency, status: data.db?.status || sys.status };
                        case 'scoring': return { ...sys, currentLatency: data.scoring?.latency || sys.currentLatency, status: data.scoring?.status || sys.status };
                        case 'auth': return { ...sys, currentLatency: data.auth?.latency || sys.currentLatency, status: data.auth?.status || sys.status };
                        default: return sys;
                    }
                }));
            } catch (err) {
                console.error("Failed to ping /api/health", err);
            }
        };

        // Fetch immediately then every 3 seconds (we don't want to DDOS our own DB)
        fetchHealth();
        const interval = setInterval(fetchHealth, 3000);

        return () => clearInterval(interval);
    }, [activeTab]);

    const handleResolve = (id: string, resolution: 'left' | 'right' | 'reject') => {
        setResolvedConflicts(prev => [...prev, id])
        // Show success animation or toast here in a real app
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] font-inter">
            {/* Header */}
            <header className="bg-si-navy text-white px-12 py-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-si-navy via-si-navy to-si-blue-primary/40 opacity-90 z-0"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-end justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Link href="/admin" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white transition-all">
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                            </Link>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tighter mb-2">Sync & Operations.</h1>
                        <p className="text-white/60 max-w-xl font-medium">
                            Manage data merge conflicts, approve system access requests, and monitor core underwriting engine infrastructure.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4 backdrop-blur-md">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Active Conflicts</span>
                                <span className="text-xl font-black">{MOCK_CONFLICTS.length - resolvedConflicts.length}</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-si-blue-primary/20 flex items-center justify-center text-si-blue-primary">
                                <GitMerge className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-[20%] -right-[5%] w-[40%] h-[150%] bg-si-blue-primary/20 rounded-full blur-[120px] pointer-events-none" />
            </header>

            <main className="max-w-[1600px] mx-auto p-12">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-slate-200">
                    {[
                        { id: 'conflicts', label: 'Merge Conflicts', icon: GitMerge, count: MOCK_CONFLICTS.length - resolvedConflicts.length },
                        { id: 'access', label: 'Access Control', icon: Shield, count: MOCK_ACCESS_REQUESTS.length },
                        { id: 'health', label: 'System Health', icon: LayoutDashboard, count: 0 }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-si-navy text-white shadow-lg shadow-si-navy/20'
                                : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-si-navy'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-si-red/10 text-si-red'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === 'conflicts' && (
                        <motion.div
                            key="conflicts"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h2 className="text-xl font-black text-si-navy font-outfit tracking-tight">Active Merge Conflicts</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Review side-by-side differences before committing to Production DB</p>
                                </div>
                                <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-si-navy rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
                                    <RefreshCw className="w-4 h-4" /> Refresh Status
                                </button>
                            </div>

                            {MOCK_CONFLICTS.filter(c => !resolvedConflicts.includes(c.id)).length === 0 ? (
                                <div className="bg-white p-20 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-2xl font-black text-si-navy font-outfit tracking-tighter mb-2">All Clear</h3>
                                    <p className="text-slate-500 font-medium">There are no pending merge conflicts to review. The database is fully synchronized.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {MOCK_CONFLICTS.filter(c => !resolvedConflicts.includes(c.id)).map((conflict) => (
                                        <div key={conflict.id} className="bg-white rounded-[32px] border border-slate-200 shadow-lg shadow-slate-200/40 overflow-hidden">
                                            {/* Conflict Header */}
                                            <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${conflict.severity === 'high' ? 'bg-si-red/10 text-si-red' : 'bg-orange-50 text-orange-500'}`}>
                                                        <FileWarning className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="text-lg font-black text-si-navy font-outfit tracking-tight">{conflict.entity}</h3>
                                                            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">{conflict.type}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {conflict.timestamp}</span>
                                                            <span>ID: {conflict.id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleResolve(conflict.id, 'reject')} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-si-red hover:text-white hover:border-si-red rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
                                                        <X className="w-4 h-4" /> Reject Both
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Diff View */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 relative lg:divide-x divide-slate-100 p-8 gap-8 lg:gap-0">
                                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-100 rounded-full hidden lg:flex items-center justify-center z-10 shadow-sm text-slate-400">
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                </div>

                                                {/* Left Panel */}
                                                <div className="lg:pr-10">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div>
                                                            <h4 className="text-sm font-black text-si-navy uppercase tracking-widest">{conflict.left.title}</h4>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-1">{conflict.left.author}</p>
                                                        </div>
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">Source A</span>
                                                    </div>
                                                    <div className="space-y-4 mb-8">
                                                        {Object.entries(conflict.left.data).map(([key, val], idx) => (
                                                            <div key={idx} className="bg-si-red/5 border border-si-red/10 rounded-2xl p-4">
                                                                <div className="text-[10px] font-black text-si-red/60 uppercase tracking-widest mb-1">{key}</div>
                                                                <div className="text-sm font-medium text-slate-700">{val as string}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => handleResolve(conflict.id, 'left')} className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-50 text-si-navy border border-slate-200 hover:border-si-navy hover:bg-si-navy hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                                        Accept Source A
                                                    </button>
                                                </div>

                                                {/* Right Panel */}
                                                <div className="lg:pl-10">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div>
                                                            <h4 className="text-sm font-black text-si-navy uppercase tracking-widest">{conflict.right.title}</h4>
                                                            <p className="text-[10px] font-bold text-si-blue-primary/60 mt-1">{conflict.right.author}</p>
                                                        </div>
                                                        <span className="px-3 py-1 bg-si-blue-primary/10 text-si-blue-primary text-[10px] font-black uppercase tracking-widest rounded-lg">Source B</span>
                                                    </div>
                                                    <div className="space-y-4 mb-8">
                                                        {Object.entries(conflict.right.data).map(([key, val], idx) => (
                                                            <div key={idx} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                                                <div className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">{key}</div>
                                                                <div className="text-sm font-medium text-slate-700">{val as string}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => handleResolve(conflict.id, 'right')} className="w-full flex items-center justify-center gap-2 py-3.5 bg-si-blue-primary text-white border border-transparent hover:shadow-lg hover:shadow-si-blue-primary/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                                                        Accept Source B <Check className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'access' && (
                        <motion.div
                            key="access"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                                <h2 className="text-xl font-black text-si-navy font-outfit tracking-tight mb-8">Pending Access Requests</h2>
                                <div className="space-y-4">
                                    {MOCK_ACCESS_REQUESTS.map(req => (
                                        <div key={req.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-si-navy text-white rounded-full flex items-center justify-center font-bold font-outfit text-lg">
                                                    {req.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-si-navy">{req.name}</h4>
                                                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        <span>{req.email}</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                        <span className="text-si-blue-primary">{req.role}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-400 mr-4">{req.time}</span>
                                                <button className="px-5 py-2.5 bg-white border border-slate-200 hover:border-si-red hover:text-si-red rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Decline</button>
                                                <button className="px-5 py-2.5 bg-si-navy text-white hover:bg-si-blue-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Approve Access</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'health' && (
                        <motion.div
                            key="health"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {healthMetrics.map((sys, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sys.bg} ${sys.color}`}>
                                                <sys.icon className="w-5 h-5" />
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${sys.status === 'Warning' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                {sys.status}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-black text-si-navy tracking-tight">{sys.name}</h4>
                                        <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>Latency</span>
                                            <motion.span
                                                key={sys.currentLatency}
                                                initial={{ opacity: 0.5, y: -2 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-si-navy"
                                            >
                                                {sys.currentLatency}ms
                                            </motion.span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

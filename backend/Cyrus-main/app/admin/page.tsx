"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
    ShieldCheck,
    LogOut,
    Users,
    FileText,
    Edit3,
    ChevronRight,
    Zap,
    Scale,
    AlertTriangle,
    Activity,
    LayoutDashboard,
    Key,
    Clock,
    ShieldAlert,
    Settings,
    GitMerge
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useUnderwriting } from "@/context/underwriting-context"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"

// Resolve any stored industry value (ID, typo ID, old name, or typo name) → correct display name
const LEGACY_INDUSTRY_MAP: Record<string, string> = {
    "it_and_tehnology_services": "IT and Technology Services",
    "logistics_and_transporation": "Logistics and Transportation",
    "it and tehnology services": "IT and Technology Services",
    "IT and Tehnology Services": "IT and Technology Services",
    "logistics and transporation": "Logistics and Transportation",
    "Logistics and Transporation": "Logistics and Transportation",
}

function resolveIndustryName(raw: string | undefined | null): string {
    if (!raw) return 'Unknown'
    const match = INDUSTRY_PROFILES.find(p => p.id === raw || p.name === raw)
    if (match) return match.name
    if (LEGACY_INDUSTRY_MAP[raw]) return LEGACY_INDUSTRY_MAP[raw]
    const lowerRaw = raw.toLowerCase()
    const legacyMatch = Object.entries(LEGACY_INDUSTRY_MAP).find(([k]) => k.toLowerCase() === lowerRaw)
    if (legacyMatch) return legacyMatch[1]
    return raw.replace(/_/g, ' ')
}

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    PolarRadiusAxis,
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
} from 'recharts'

export default function AdminPage() {
    const router = useRouter()
    const supabase = createClient()
    const { isAdmin, signOut } = useUnderwriting()

    const [stats, setStats] = useState({
        clients: 0,
        admins: 0,
        reports: 0,
        killerFailures: 0
    })
    const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [trendData, setTrendData] = useState<any[]>([])
    const [radarData, setRadarData] = useState<any[]>([])
    const [sectorData, setSectorData] = useState<any[]>([])
    const [tierDistribution, setTierDistribution] = useState<any[]>([])

    const COLORS = ['#10b981', '#2563eb', '#f59e0b', '#ef4444']



    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true)
                const [profilesClientRes, profilesAdminRes, assessRes, allAssessRes] = await Promise.all([
                    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client'),
                    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
                    supabase.from('assessments').select('*').order('created_at', { ascending: false }).limit(50),
                    supabase.from('assessments').select('total_score, auto_declined, created_at, submission_data, industry_id, risk_tier, user_id')
                ])

                let assessments: any[] = assessRes.data || []
                let allAssess: any[] = allAssessRes.data || []

                // Fetch Profiles separately to avoid join issues (PostgREST relationship discovery)
                const userIds = [...new Set([...assessments.map(a => a.user_id), ...allAssess.map(a => a.user_id)])]
                if (userIds.length > 0) {
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('id, organization_name, username, industry, email, name')
                        .in('id', userIds)

                    if (profilesData) {
                        const profileMap = new Map(profilesData.map(p => [p.id, p]))
                        assessments = assessments.map(a => ({ ...a, profiles: profileMap.get(a.user_id) }))
                        allAssess = allAssess.map(a => ({ ...a, profiles: profileMap.get(a.user_id) }))
                    }
                }
                const killerFailures = allAssess.filter(a => a.auto_declined).length

                setStats({
                    clients: profilesClientRes.count || 0,
                    admins: profilesAdminRes.count || 0,
                    reports: allAssess.length,
                    killerFailures
                })
                setRecentSubmissions(assessments)

                // Process Trend Data (Last 7 Days)
                const days = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date()
                    date.setDate(date.getDate() - (6 - i))
                    return date.toISOString().split('T')[0]
                })

                const trends = days.map(day => {
                    const count = allAssess.filter(a => a.created_at?.startsWith(day)).length
                    const dateObj = new Date(day)
                    const dayLabel = dateObj.toLocaleDateString([], { weekday: 'short' })
                    const dateLabel = dateObj.getDate()
                    return { name: `${dayLabel} ${dateLabel}`, count }
                })
                setTrendData(trends)

                // Process Radar Data (Global Averages)
                const domainTotals: Record<string, { total: number, count: number }> = {}
                allAssess.forEach(a => {
                    const domains = (a.submission_data as any)?.result?.domainScores || []
                    domains.forEach((ds: any) => {
                        if (!domainTotals[ds.domain]) domainTotals[ds.domain] = { total: 0, count: 0 }
                        domainTotals[ds.domain].total += ds.score
                        domainTotals[ds.domain].count += 1
                    })
                })

                const radar = Object.entries(domainTotals).map(([name, stats]) => ({
                    subject: name.split(' ').map(w => w[0]).join(''), // Abbreviate for radar
                    fullName: name,
                    A: Math.round(stats.total / stats.count),
                    fullMark: 100
                })).slice(0, 6) // Top 6 domains for clarity
                setRadarData(radar)

                // Process Sector Data
                const sectorCounts: Record<string, number> = {}
                allAssess.forEach(a => {
                    const resolvedIndustry = resolveIndustryName((a.profiles as any)?.industry || a.industry_id)
                    sectorCounts[resolvedIndustry] = (sectorCounts[resolvedIndustry] || 0) + 1
                })
                const topSectors = Object.entries(sectorCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 4)
                setSectorData(topSectors)

                // Process Tier Distribution
                const tierCounts: Record<string, number> = { 'A': 0, 'B': 0, 'C': 0, 'D': 0 }
                allAssess.forEach(a => {
                    const tier = a.submission_data?.result?.riskTier || a.risk_tier || 'D'
                    const cleanTier = tier.includes('A') ? 'A' : tier.includes('B') ? 'B' : tier.includes('C') ? 'C' : 'D'
                    tierCounts[cleanTier] = (tierCounts[cleanTier] || 0) + 1
                })
                setTierDistribution([
                    { name: 'Tier A', value: tierCounts['A'], color: '#10b981' },
                    { name: 'Tier B', value: tierCounts['B'], color: '#2563eb' },
                    { name: 'Tier C', value: tierCounts['C'], color: '#f59e0b' },
                    { name: 'Decline', value: tierCounts['D'], color: '#ef4444' },
                ])

                setIsLoading(false)
            } catch (err) {
                console.error("Error fetching dashboard data:", err)
                setIsLoading(false)
            }
        }

        fetchDashboardData()

        // Realtime Subscription for Live Updates
        const channel = supabase
            .channel('admin_dashboard')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'assessments'
            }, () => {
                fetchDashboardData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-12 h-12 text-si-navy animate-pulse" />
                    <span className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em]">Loading Dashboard...</span>
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <ShieldAlert className="w-12 h-12 text-si-red mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-si-navy">Access Denied</h1>
                    <p className="text-slate-500 mt-2">Only administrators can access the Audit Console.</p>
                    <Link href="/" className="mt-6 inline-block px-6 py-2 bg-si-navy text-white rounded-xl">Return Home</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white font-inter text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-si-navy border-b border-white/5 px-8 py-6 flex items-center justify-between sticky top-0 z-50 shadow-2xl">
                <div className="flex items-center gap-6">
                    <img src="/share-india-new.png" alt="Share India" className="h-8 w-auto brightness-0 invert" />
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em]">Access Level: Admin</span>
                        </div>
                        <span className="text-sm font-bold text-white font-outfit">Cyber Insurance Audit Portal</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex items-center gap-4 text-white/40">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Encryption</span>
                            <span className="text-[10px] font-bold text-white/60 uppercase">AES-256 Active</span>
                        </div>
                        <Key className="w-4 h-4 opacity-50" />
                    </div>
                    <Link
                        href="/admin/settings"
                        className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all rounded-xl border border-white/10 group"
                    >
                        <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    </Link>
                    <button
                        onClick={signOut}
                        className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-si-red transition-all rounded-xl border border-white/10 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto p-12">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {[
                        {
                            label: 'Active Nodes',
                            val: `${stats.clients + stats.admins}`,
                            subtext: `${stats.clients} Clients · ${stats.admins} Admins`,
                            icon: Users,
                            color: 'text-blue-500',
                            bg: 'bg-blue-500/10',
                            border: 'group-hover:border-blue-200'
                        },
                        { label: 'Audit Reports', val: stats.reports, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'group-hover:border-emerald-200' },
                        { label: 'Killer Failures', val: stats.killerFailures, icon: Zap, color: 'text-si-red', bg: 'bg-si-red/10', border: 'group-hover:border-red-200' },
                    ].map((s, i) => (
                        <div key={i} className={`bg-white p-8 rounded-[28px] border border-slate-100 ${s.border} relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-0.5 flex flex-col justify-between`}>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className={`w-11 h-11 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                                        <s.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">{s.label}</span>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-4xl font-black text-si-navy font-outfit tracking-tighter">{s.val}</p>
                                    {s.subtext && (
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{s.subtext}</p>
                                    )}
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 opacity-[0.04] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-500">
                                <s.icon className="w-24 h-24" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section 1: Audit Activity Log + Risk Configuration — top priority */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    {/* Audit Activity Log */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-8 py-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-si-navy text-white rounded-xl flex items-center justify-center">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-si-navy font-outfit tracking-tight">Audit Activity Log</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Assessment Feed</p>
                                    </div>
                                </div>
                                <Link href="/admin/submissions" className="text-[10px] font-black text-si-blue-primary uppercase tracking-[0.3em] hover:text-si-navy hover:underline transition-all">
                                    Full Archives →
                                </Link>
                            </div>

                            <div className="overflow-y-auto p-4 custom-scrollbar max-h-[600px]">
                                {recentSubmissions.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 p-16 text-center">
                                        <LayoutDashboard className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="font-bold uppercase tracking-widest text-[10px]">No recent data packets detected.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {recentSubmissions.map((sub, idx) => (
                                            <Link
                                                href={`/admin/submissions/${sub.id}`}
                                                key={sub.id}
                                                className="block px-5 py-4 bg-slate-50/60 hover:bg-white rounded-2xl border border-transparent hover:border-slate-200 hover:shadow-sm transition-all duration-200 group relative overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-16 h-10 rounded-lg flex items-center justify-center font-black text-[10px] tracking-tight transition-all duration-300 shrink-0 ${sub.auto_declined ? 'bg-si-red/10 text-si-red' : 'bg-white text-si-navy border border-slate-100 group-hover:bg-si-blue-primary group-hover:text-white group-hover:border-transparent'}`}>
                                                            {sub.total_score}%
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className="text-sm font-black text-si-navy">
                                                                    {sub.profiles?.organization_name || resolveIndustryName(sub.industry_id) || 'Unknown'}
                                                                </span>
                                                                {sub.auto_declined && (
                                                                    <span className="text-[8px] font-black bg-si-red/10 text-si-red px-2 py-0.5 rounded uppercase tracking-widest">Failed</span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3" />
                                                                    {sub.profiles?.name || sub.profiles?.username || sub.profiles?.email || `Node: ${sub.user_id?.substring(0, 8) || 'Unknown'}`}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <LayoutDashboard className="w-3 h-3" />
                                                                    {resolveIndustryName(sub.profiles?.industry || sub.industry_id)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {sub.created_at ? `${new Date(sub.created_at).toLocaleDateString()} ${new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Unknown Date'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-si-blue-primary group-hover:translate-x-1 transition-all shrink-0" />
                                                </div>
                                                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-slate-100">
                                                    <div className={`h-full transition-all duration-1000 ${sub.auto_declined ? 'bg-si-red/50' : 'bg-emerald-400/60'}`} style={{ width: `${sub.total_score}%` }} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Risk Configuration */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <Link href="/admin/content" className="block group flex-1">
                            <div className="bg-gradient-to-br from-si-navy to-si-navy/90 text-white p-8 rounded-[28px] shadow-xl shadow-si-navy/15 hover:from-si-blue-primary hover:to-si-navy transition-all duration-500 relative overflow-hidden h-full">
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-11 h-11 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Scale className="w-5 h-5" />
                                            </div>
                                            <div className="w-11 h-11 bg-si-red/20 rounded-xl border border-si-red/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <AlertTriangle className="w-5 h-5 text-si-red" />
                                            </div>
                                        </div>
                                        <h4 className="text-2xl font-black font-outfit tracking-tight mb-3">Risk<br />Configuration.</h4>
                                        <p className="text-sm text-white/50 font-medium leading-relaxed">
                                            Adjust domain multipliers, strategic risk weights, and manage killer units.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <span className="text-[9px] font-bold bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider">Weights</span>
                                            <span className="text-[9px] font-bold bg-si-red/20 text-si-red px-3 py-1 rounded-full uppercase tracking-wider">Killer Units</span>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] group-hover:gap-4 transition-all">
                                        Configure Settings <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="absolute right-[-20px] top-[-20px] w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors" />
                            </div>
                        </Link>

                        <Link href="/admin/approvals" className="block w-full bg-white p-6 rounded-[28px] border border-slate-100 hover:border-si-blue-primary/30 hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-si-blue-primary/10 text-si-blue-primary flex items-center justify-center group-hover:bg-si-blue-primary group-hover:text-white transition-colors">
                                        <GitMerge className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-si-navy font-outfit tracking-tight">Data Sync & Approvals</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manage Conflicts</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-si-blue-primary/10 group-hover:text-si-blue-primary transition-colors group-hover:translate-x-1">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>

                        {/* Top Sectors mini grid */}
                        <div className="bg-white p-6 rounded-[28px] border border-slate-100">
                            <h3 className="text-[10px] font-black text-si-navy/30 uppercase tracking-[0.4em] mb-4">Top Performance Segments</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {sectorData.map((sector, i) => (
                                    <div key={i} className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 group hover:border-si-blue-primary/20 hover:bg-white transition-all">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1 truncate">{sector.name}</span>
                                        <span className="text-xl font-black text-si-navy font-outfit">{sector.count}</span>
                                    </div>
                                ))}
                                {sectorData.length === 0 && (
                                    <div className="col-span-2 py-6 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                                        No sector data
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    {/* Submission Velocity */}
                    <div className="lg:col-span-7 bg-white p-8 rounded-[28px] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-si-blue-primary" />
                                <h3 className="text-xs font-black text-si-navy uppercase tracking-[0.4em]">Submission Velocity</h3>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">Last 7 Days</span>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                    <YAxis hide />
                                    <RechartsTooltip isAnimationActive={false} cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }} labelStyle={{ display: 'none' }} />
                                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={22} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Global Risk Factor */}
                    <div className="lg:col-span-5 bg-si-navy p-8 rounded-[28px] border border-white/5 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <Zap className="w-4 h-4 text-si-blue-primary" />
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.4em]">Global Risk Factor</h3>
                        </div>
                        <div className="h-[240px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#ffffff10" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff40', fontSize: 8, fontWeight: 900 }} />
                                    <Radar name="Global Avg" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                                    <RechartsTooltip isAnimationActive={false} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }} labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-si-blue-primary/10 to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* Section 3: Risk Distribution + Sector Volume */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Risk Distribution Pie */}
                    <div className="lg:col-span-4 bg-white p-8 rounded-[28px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <PieChart className="w-4 h-4 text-si-blue-primary" />
                            <h3 className="text-xs font-black text-si-navy uppercase tracking-[0.4em]">Risk Distribution</h3>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={tierDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                                        {tierDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip isAnimationActive={false} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 mt-2">
                            {tierDistribution.map((t, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sector Volume */}
                    <div className="lg:col-span-8 bg-white p-8 rounded-[28px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <BarChart className="w-4 h-4 text-si-blue-primary" />
                            <h3 className="text-xs font-black text-si-navy uppercase tracking-[0.4em]">Sector Volume Analysis</h3>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={sectorData}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1e293b', fontSize: 10, fontWeight: 900 }} width={160} />
                                    <RechartsTooltip isAnimationActive={false} cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }} labelStyle={{ display: 'none' }} />
                                    <Bar dataKey="count" fill="#2563eb" radius={[0, 8, 8, 0]} barSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

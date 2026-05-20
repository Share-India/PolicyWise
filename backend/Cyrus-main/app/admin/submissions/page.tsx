"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    ShieldCheck,
    ArrowLeft,
    FileText,
    ExternalLink,
    Calendar,
    User,
    BarChart,
    Search,
    Filter,
    Download,
    ChevronDown,
    ArrowUpDown
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"

// Helper to resolve industry ID or stored name to human-readable name
const LEGACY_INDUSTRY_MAP: Record<string, string> = {
    // Old typo IDs
    "it_and_tehnology_services": "IT and Technology Services",
    "logistics_and_transporation": "Logistics and Transportation",
    // Old typo names (stored directly in profiles.industry)
    "it and tehnology services": "IT and Technology Services",
    "IT and Tehnology Services": "IT and Technology Services",
    "logistics and transporation": "Logistics and Transportation",
    "Logistics and Transporation": "Logistics and Transportation",
}

const resolveIndustryName = (industryRaw: string | undefined | null): string => {
    if (!industryRaw) return "—"
    // Direct match against current profiles
    const match = INDUSTRY_PROFILES.find(
        p => p.id === industryRaw || p.name === industryRaw
    )
    if (match) return match.name
    // Legacy name/ID correction
    if (LEGACY_INDUSTRY_MAP[industryRaw]) return LEGACY_INDUSTRY_MAP[industryRaw]
    // Case-insensitive legacy check
    const lowerRaw = industryRaw.toLowerCase()
    const legacyMatch = Object.entries(LEGACY_INDUSTRY_MAP).find(([k]) => k.toLowerCase() === lowerRaw)
    if (legacyMatch) return legacyMatch[1]
    // Final fallback: replace underscores with spaces
    return industryRaw.replace(/_/g, ' ')
}

interface Submission {
    id: string
    user_id: string
    industry_id: string
    total_score: number
    risk_tier: string
    premium_loading: string
    auto_declined: boolean
    approval_status: 'pending' | 'approved' | 'rejected'
    underwriter_notes: string | null
    created_at: string
    profiles: {
        email: string
        organization_name: string
    }
}

export default function SubmissionsDashboard() {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedSector, setSelectedSector] = useState("All")
    const [selectedTier, setSelectedTier] = useState("All")
    const [selectedStatus, setSelectedStatus] = useState("All")
    const [minScore, setMinScore] = useState(0)
    const [sortConfig, setSortConfig] = useState<{ key: keyof Submission | 'profiles.organization_name', direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' })
    const supabase = createClient()

    useEffect(() => {
        const fetchSubmissions = async () => {
            // Fetch all assessments
            const { data: assessmentsData, error: assessmentsError } = await supabase
                .from('assessments')
                .select('*')
                .order('created_at', { ascending: false })

            if (assessmentsError) {
                console.error("Error fetching submissions:", assessmentsError)
                alert(`Error: ${assessmentsError.message}`)
                setIsLoading(false)
                return
            }

            if (assessmentsData && assessmentsData.length > 0) {
                // Fetch all unique user profiles
                const userIds = [...new Set(assessmentsData.map(a => a.user_id))]
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, email, organization_name, name, username, industry')
                    .in('id', userIds)

                // Create a map of user_id to profile
                const profileMap = new Map(
                    profilesData?.map(p => [p.id, p]) || []
                )

                // Combine the data
                const combinedData = assessmentsData.map(assessment => ({
                    ...assessment,
                    profiles: profileMap.get(assessment.user_id) || { email: 'Unknown' }
                }))

                setSubmissions(combinedData as any)
            }
            setIsLoading(false)
        }

        fetchSubmissions()
    }, [supabase])

    const filteredSubmissions = useMemo(() => {
        let result = [...submissions]

        // Search Filter
        if (searchTerm) {
            const lowTerm = searchTerm.toLowerCase()
            result = result.filter(s =>
                (s.profiles as any)?.organization_name?.toLowerCase().includes(lowTerm) ||
                (s.profiles as any)?.email?.toLowerCase().includes(lowTerm) ||
                s.id.toLowerCase().includes(lowTerm)
            )
        }

        // Sector Filter
        if (selectedSector !== "All") {
            result = result.filter(s => resolveIndustryName((s.profiles as any)?.industry || s.industry_id) === selectedSector)
        }

        // Tier Filter
        if (selectedTier !== "All") {
            const cleanTier = selectedTier.replace('TIER ', '').replace('DECLINE', 'D')
            result = result.filter(s => s.risk_tier.includes(cleanTier))
        }

        // Status Filter
        if (selectedStatus !== "All") {
            result = result.filter(s => (s.approval_status || 'pending') === selectedStatus.toLowerCase())
        }

        // Score Range Filter
        if (minScore > 0) {
            result = result.filter(s => s.total_score >= minScore)
        }

        // Sorting
        result.sort((a, b) => {
            let aVal: any = a[sortConfig.key as keyof Submission]
            let bVal: any = b[sortConfig.key as keyof Submission]

            if (sortConfig.key === 'profiles.organization_name') {
                aVal = (a.profiles as any)?.organization_name || "Individual"
                bVal = (b.profiles as any)?.organization_name || "Individual"
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })

        return result
    }, [submissions, searchTerm, selectedSector, selectedTier, sortConfig])

    const handleSort = (key: keyof Submission | 'profiles.organization_name') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }))
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-si-navy/10 border-t-si-navy rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-inter text-slate-900">
            <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </Link>
                    <div className="h-6 w-[1px] bg-slate-200" />
                    <div>
                        <span className="text-[10px] text-si-red font-bold uppercase tracking-widest block">Admin Console</span>
                        <span className="text-sm font-bold text-si-navy font-outfit">Detailed Submissions</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-si-navy font-outfit mb-2">Audit Reports</h1>
                        <p className="text-slate-500 font-medium">Review and analyze finalized client underwriting submissions.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                const headers = ["ID", "Organization", "User", "Sector", "Score", "Tier", "Auto Declined", "Date"]
                                const rows = filteredSubmissions.map(s => [
                                    s.id,
                                    (s.profiles as any)?.organization_name || "Individual",
                                    (s.profiles as any)?.name || s.profiles?.email,
                                    resolveIndustryName((s.profiles as any)?.industry || s.industry_id),
                                    `${s.total_score}%`,
                                    s.risk_tier,
                                    s.auto_declined ? "YES" : "NO",
                                    new Date(s.created_at).toLocaleDateString()
                                ])
                                const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                                const url = URL.createObjectURL(blob)
                                const link = document.createElement("a")
                                link.setAttribute("href", url)
                                link.setAttribute("download", `submissions_export_${new Date().toISOString().split('T')[0]}.csv`)
                                link.style.visibility = 'hidden'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                            }}
                            className="px-6 py-2.5 bg-si-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-si-blue-primary transition-all shadow-lg shadow-si-navy/10"
                        >
                            <Download className="w-4 h-4" />
                            Export Queue
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Pending Review", count: submissions.filter(s => !s.approval_status || s.approval_status === 'pending').length, color: "text-amber-500", bg: "bg-amber-50" },
                        { label: "Approved", count: submissions.filter(s => s.approval_status === 'approved').length, color: "text-emerald-500", bg: "bg-emerald-50" },
                        { label: "Rejected", count: submissions.filter(s => s.approval_status === 'rejected').length, color: "text-si-red", bg: "bg-red-50" },
                        { label: "Total Audits", count: submissions.length, color: "text-si-navy", bg: "bg-slate-50" }
                    ].map((kpi, idx) => (
                        <div key={idx} className={`${kpi.bg} p-6 rounded-[32px] border border-transparent hover:border-slate-100 transition-all`}>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{kpi.label}</span>
                            <span className={`text-3xl font-black font-outfit ${kpi.color}`}>{kpi.count}</span>
                        </div>
                    ))}
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-wrap items-center gap-6">
                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Organization, Email or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-si-blue-primary/10 transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                            <Filter className="w-3 h-3 text-slate-400" />
                            <select
                                value={selectedSector}
                                onChange={(e) => setSelectedSector(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
                            >
                                <option value="All">All Sectors</option>
                                {[...new Set(submissions.map(s => resolveIndustryName((s.profiles as any)?.industry || s.industry_id)))].map(sector => (
                                    <option key={sector} value={sector}>{sector}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                            <ShieldCheck className="w-3 h-3 text-slate-400" />
                            <select
                                value={selectedTier}
                                onChange={(e) => setSelectedTier(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
                            >
                                <option value="All">All Tiers</option>
                                <option value="TIER A">Tier A</option>
                                <option value="TIER B">Tier B</option>
                                <option value="TIER C">Tier C</option>
                                <option value="DECLINE">Decline</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[100px]">Min Score: {minScore}%</span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={minScore}
                                onChange={(e) => setMinScore(parseInt(e.target.value))}
                                className="w-32 accent-si-navy h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
                <span className="text-sm font-bold text-si-navy">{submissions.length} Total Submissions</span>
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th
                                        onClick={() => handleSort('profiles.organization_name')}
                                        className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            Organization / Client
                                            {sortConfig.key === 'profiles.organization_name' && <ArrowUpDown className="w-3 h-3" />}
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User / Sector</th>
                                    <th
                                        onClick={() => handleSort('total_score')}
                                        className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center cursor-pointer hover:bg-slate-100/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Score
                                            {sortConfig.key === 'total_score' && <ArrowUpDown className="w-3 h-3" />}
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Tier</th>
                                    <th
                                        onClick={() => handleSort('created_at')}
                                        className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            Status / Date
                                            {sortConfig.key === 'created_at' && <ArrowUpDown className="w-3 h-3" />}
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubmissions.map((sub, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={sub.id}
                                        className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-si-navy text-xs uppercase group-hover:bg-si-navy group-hover:text-white transition-colors duration-300">
                                                    {(sub.profiles as any)?.organization_name?.substring(0, 2) || (sub.profiles as any)?.email?.substring(0, 2) || 'CL'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-si-navy">{(sub.profiles as any)?.organization_name || 'Individual Client'}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ID: {sub.id.substring(0, 8)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-600 truncate max-w-[150px]">
                                                    {(sub.profiles as any)?.name || (sub.profiles as any)?.email}
                                                </span>
                                                <span className="text-[10px] font-black text-si-blue-primary tracking-tighter">
                                                    {resolveIndustryName((sub.profiles as any)?.industry || sub.industry_id)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-block px-3 py-1 bg-si-blue-primary/10 rounded-lg">
                                                <span className="text-sm font-black text-si-blue-primary">{sub.total_score}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex justify-center">
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${sub.risk_tier.includes('A') ? 'bg-emerald-100/80 text-emerald-700' :
                                                    sub.risk_tier.includes('B') ? 'bg-amber-100/80 text-amber-700' :
                                                        'bg-si-red/10 text-si-red'
                                                    }`}>
                                                    <span className="text-[12px] font-black uppercase tracking-widest">{sub.risk_tier.split(' ')[1] || sub.risk_tier}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <div className="mb-2">
                                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                                        sub.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                        sub.approval_status === 'rejected' ? 'bg-si-red/10 text-si-red' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {sub.approval_status || 'PENDING'}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">
                                                    {new Date(sub.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                                    {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link
                                                href={`/admin/submissions/${sub.id}`}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-si-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-si-blue-primary transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                                            >
                                                <span>Review</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))}
                                {filteredSubmissions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Search className="w-12 h-12 text-slate-200" />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching audits found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main >
        </div >
    )
}

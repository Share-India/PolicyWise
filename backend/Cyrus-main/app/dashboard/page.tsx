"use client"

import { useUnderwriting } from "@/context/underwriting-context"
import { RiskEngine } from "@/components/risk-engine"
import { DecisionPanel } from "@/components/decision-panel"
import { motion } from "framer-motion"
import { ArrowLeft, Download, FileText, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { downloadPDFSummary } from "@/lib/pdf-report-generator"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"

export default function DashboardPage() {
    const router = useRouter()
    const { result, domains, completionStats, isAdmin, clientName, selectedIndustry, signOut } = useUnderwriting()

    // Get industry name from ID
    const industryName = INDUSTRY_PROFILES.find(p => p.id === selectedIndustry)?.name || ''

    // Redirect if no data
    if (completionStats.percentage === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 font-inter">
                <div className="text-center space-y-4">
                    <p className="text-slate-500 font-medium">No assessment data found.</p>
                    <Link href="/assessment" className="inline-flex items-center gap-2 px-6 py-3 bg-si-blue-primary text-white rounded-xl font-bold hover:bg-si-navy transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Start Assessment
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent font-inter text-slate-900 pb-20">
            <header className="glass-panel sticky top-4 z-40 mx-4 rounded-2xl px-6 py-4 flex items-center justify-between mb-8 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <Link href="/assessment" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-si-navy">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">
                            {isAdmin ? "Admin Analysis" : "Risk Intelligence"}
                        </span>
                        <span className="text-lg font-black text-si-navy font-outfit tracking-tight">
                            {isAdmin ? "Admin Analytics Terminal" : "Risk Profile Dashboard"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => downloadPDFSummary(result, domains, clientName, industryName)}
                        className="group px-5 py-2.5 bg-white border border-slate-200 text-si-navy text-xs font-black uppercase tracking-widest rounded-xl hover:bg-si-navy hover:text-white hover:border-si-navy transition-all duration-300 shadow-sm hover:shadow-lg flex items-center gap-2"
                        title="Download PDF Summary"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden md:inline">Download Report</span>
                    </button>

                    <div className="w-[1px] h-6 bg-slate-200 hidden md:block" />

                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-si-red hover:border-si-red/30 transition-all active:scale-95 bg-white/50"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden lg:inline">Exit</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
                {/* Summary Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <div className="glass-card rounded-3xl p-6 border-l-4 border-l-si-blue-primary">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Overall Risk Score</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-si-navy font-outfit">{result.totalScore.toFixed(1)}</span>
                            <span className="text-sm font-bold text-slate-400">/ 100</span>
                        </div>
                    </div>
                    <div className="glass-card rounded-3xl p-6 border-l-4 border-l-emerald-500">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Completion Status</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-emerald-600 font-outfit">{completionStats.percentage}%</span>
                            <span className="text-sm font-bold text-slate-400">Complete</span>
                        </div>
                    </div>
                    <div className="glass-card rounded-3xl p-6 border-l-4 border-l-si-navy">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Industry Profile</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-si-navy font-outfit truncate" title={industryName || "General"}>{industryName || "General"}</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                    {/* Visual Analytics */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2 px-1">
                            <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-si-navy border border-slate-100">
                                <FileText className="w-4 h-4" />
                            </div>
                            <h2 className="text-lg font-black text-si-navy font-outfit uppercase tracking-tight">Risk Analysis</h2>
                        </div>
                        <div className="glass-panel rounded-[2.5rem] overflow-hidden h-[600px] md:h-[800px] border border-white/60 shadow-xl shadow-si-blue-primary/5">
                            <RiskEngine result={result} domains={domains} />
                        </div>
                    </div>

                    {/* Decision Factors */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2 px-1">
                            <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-si-navy border border-slate-100">
                                <Settings className="w-4 h-4" />
                            </div>
                            <h2 className="text-lg font-black text-si-navy font-outfit uppercase tracking-tight">Decision Protocol</h2>
                        </div>
                        <div className="glass-panel rounded-[2.5rem] overflow-hidden h-[600px] md:h-[800px] border border-white/60 shadow-xl shadow-si-blue-primary/5">
                            <DecisionPanel
                                result={result}
                                domains={domains}
                                completionPercentage={completionStats.percentage}
                                onNavigateToDomain={() => router.push("/assessment")}
                            />
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}

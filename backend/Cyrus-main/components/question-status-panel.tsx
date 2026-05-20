"use client"

import type { Domain } from "@/lib/scoring-engine"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, Target, ListChecks, ArrowUpRight, Activity } from "lucide-react"

interface QuestionStatusPanelProps {
    domains: Domain[]
    onDomainClick: (domainId: string) => void
}

export function QuestionStatusPanel({ domains, onDomainClick }: QuestionStatusPanelProps) {
    const totalQuestions = domains.reduce((sum, d) => sum + d.questions.length, 0)
    const answeredQuestions = domains.reduce(
        (sum, d) => sum + d.questions.filter((q) => q.response !== -1).length,
        0,
    )
    const unansweredQuestions = totalQuestions - answeredQuestions
    const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100)

    return (
        <div className="h-full flex flex-col bg-white text-si-navy font-inter">
            {/* Mini Profile/Status Header */}
            <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-si-blue-primary text-white flex items-center justify-center shadow-lg shadow-si-blue-primary/30">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-si-navy leading-none font-outfit uppercase tracking-tight">Status Cockpit</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5">Live Completion Tracker</p>
                    </div>
                </div>

                {/* Big Percentage Display */}
                <div className="flex items-end gap-3 mb-2">
                    <span className="text-6xl font-black text-si-blue-primary font-outfit leading-none">
                        {completionPercentage}%
                    </span>
                    <span className="text-[11px] font-black text-si-navy uppercase tracking-widest mb-1.5">Complete</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-si-blue-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 1 }}
                    />
                </div>
            </div>

            {/* Scrollable Domain List */}
            <div className="flex-1 overflow-y-auto p-0 scroll-smooth">
                <ul>
                    {domains.map((domain) => {
                        const answeredInDomain = domain.questions.filter(q => q.response !== -1).length
                        const totalInDomain = domain.questions.length
                        const isComplete = answeredInDomain === totalInDomain
                        const percent = Math.round((answeredInDomain / totalInDomain) * 100)

                        return (
                            <li
                                key={domain.id}
                                onClick={() => onDomainClick(domain.id)}
                                className={`px-8 py-5 border-b border-slate-50 transition-colors duration-300 cursor-pointer ${isComplete ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-[11px] font-black uppercase tracking-tight font-outfit flex-1 min-w-0 break-words ${isComplete ? 'text-emerald-700' : 'text-slate-600'}`}>
                                        {domain.name}
                                    </span>
                                    {isComplete && <Activity className="w-3 h-3 text-emerald-500" />}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-si-blue-primary'}`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 w-8 text-right">{percent}%</span>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>

            {/* Footer Branded Element */}
            <div className="p-8 border-t border-slate-100 bg-slate-50">
                <p className="text-[9px] font-black text-si-navy uppercase tracking-[0.4em] mb-2 text-center">
                    "YOU GENERATE, WE MULTIPLE"
                </p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">
                    Market Leaders in Risk Management
                </p>
            </div>
        </div>
    )
}

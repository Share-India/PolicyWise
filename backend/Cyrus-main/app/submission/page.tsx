"use client"

import { useUnderwriting } from "@/context/underwriting-context"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle2, Clock, FileCheck, Mail, FileText } from "lucide-react"
import Link from "next/link"
import { downloadPDFSummary } from "@/lib/pdf-report-generator"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"

export default function SubmissionPage() {
    const { result, domains, clientName, selectedIndustry } = useUnderwriting()

    // Get industry name from ID
    const industryName = INDUSTRY_PROFILES.find(p => p.id === selectedIndustry)?.name || ''

    return (
        <div className="min-h-screen bg-slate-50 font-inter text-slate-900 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 relative overflow-hidden text-center"
            >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500">
                    <CheckCircle2 className="w-10 h-10" />
                </div>

                <h1 className="text-3xl font-black text-si-navy font-outfit mb-4">Assessment Submitted</h1>
                <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
                    Your cyber risk profile has been successfully captured. The underwriting team will review the data and generate a formal quote shortly.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2 text-si-navy font-bold text-sm">
                            <Clock className="w-4 h-4 text-si-blue-primary" />
                            <span>Review</span>
                        </div>
                        <p className="text-xs text-slate-500">Underwriting analysis in progress (24-48 hrs)</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2 text-si-navy font-bold text-sm">
                            <FileCheck className="w-4 h-4 text-si-blue-primary" />
                            <span>Quote</span>
                        </div>
                        <p className="text-xs text-slate-500">Formal term sheet generated based on Tier {result.riskTier}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2 text-si-navy font-bold text-sm">
                            <Mail className="w-4 h-4 text-si-blue-primary" />
                            <span>Issue</span>
                        </div>
                        <p className="text-xs text-slate-500">Policy issuance upon acceptance</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => downloadPDFSummary(result, domains, clientName, industryName)}
                        className="px-8 py-4 bg-si-navy text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-si-blue-primary transition-all duration-300 shadow-xl shadow-si-navy/20 flex items-center gap-3 justify-center group"
                    >
                        <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Download PDF Summary</span>
                    </button>
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-si-blue-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-si-navy transition-all duration-300 shadow-xl shadow-si-blue-primary/20 flex items-center gap-3 justify-center"
                    >
                        <FileCheck className="w-4 h-4" />
                        <span>View Risk Analysis</span>
                    </Link>
                    <Link
                        href="/"
                        className="px-8 py-4 bg-white border border-slate-200 text-si-navy font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 justify-center"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Return Home</span>
                    </Link>
                </div>

                {/* Decorative */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-si-blue-primary/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
            </motion.div>
        </div>
    )
}

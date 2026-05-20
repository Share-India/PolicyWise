"use client"

import { CERT_RELEVANCY_MAP, RelevancyLevel, INDUSTRY_PROFILES } from "@/lib/scoring-engine"
import { motion } from "framer-motion"
import { Shield, Info, AlertCircle, CheckCircle2 } from "lucide-react"

interface CertRelevancyChartProps {
    selectedIndustryId: string | null
}

const RELEVANCY_METADATA: Record<RelevancyLevel, {
    label: string,
    color: string,
    bg: string,
    border: string,
    icon: any,
    description: string
}> = {
    critical: {
        label: "High Priority",
        color: "text-si-red",
        bg: "bg-si-red/5",
        border: "border-si-red/20",
        icon: AlertCircle,
        description: "Crucial for core regulatory compliance and risk underwriting in this sector."
    },
    standard: {
        label: "Recommended",
        color: "text-si-blue-primary",
        bg: "bg-si-blue-primary/5",
        border: "border-si-blue-primary/20",
        icon: Shield,
        description: "Industry standard benchmark for general security posture."
    },
    niche: {
        label: "Optional / Niche",
        color: "text-slate-400",
        bg: "bg-slate-50",
        border: "border-slate-200",
        icon: Info,
        description: "Only applicable if specific operations (like health data) are handled."
    },
    not_required: {
        label: "Not Required",
        color: "text-slate-300",
        bg: "bg-transparent",
        border: "border-slate-100",
        icon: Info,
        description: "Generally not applicable for this industry vertical."
    }
}

export function CertRelevancyChart({ selectedIndustryId }: CertRelevancyChartProps) {
    if (!selectedIndustryId) return null

    // Normalize industry ID (handle cases where display name might be passed)
    const normalizedId = INDUSTRY_PROFILES.find(p =>
        p.id === selectedIndustryId || p.name === selectedIndustryId
    )?.id || selectedIndustryId

    return (
        <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h5 className="text-[10px] font-black text-si-blue-primary uppercase tracking-[0.2em] mb-1">
                        Relevancy Matrix
                    </h5>
                    <p className="text-xs font-bold text-si-navy font-outfit uppercase tracking-tight">
                        Protocol Matrix for {INDUSTRY_PROFILES.find(p => p.id === normalizedId)?.name || "General Security Standard"}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-si-red shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Critical</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-si-blue-primary" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Standard</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {CERT_RELEVANCY_MAP.map((cert) => {
                    const level = cert.levels[normalizedId] || "not_required"
                    const meta = RELEVANCY_METADATA[level]
                    const Icon = meta.icon

                    return (
                        <motion.div
                            key={cert.id}
                            whileHover={{ y: -2 }}
                            className={`relative p-4 rounded-2xl border ${meta.bg} ${meta.border} transition-all duration-300 group`}
                        >
                            <div className="flex flex-col gap-3">
                                <div className={`w-8 h-8 rounded-lg ${meta.bg} ${meta.border} border flex items-center justify-center ${meta.color}`}>
                                    <Icon className="w-4 h-4" />
                                </div>

                                <div>
                                    <h6 className="text-[11px] font-bold text-si-navy leading-tight mb-0.5">
                                        {cert.name}
                                    </h6>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${meta.color}`}>
                                        {meta.label}
                                    </span>
                                </div>
                            </div>

                            {/* Tooltip on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4 text-center z-10 border border-slate-100 shadow-xl pointer-events-none">
                                <p className="text-[9px] font-medium text-slate-500 leading-normal">
                                    {meta.description}
                                </p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

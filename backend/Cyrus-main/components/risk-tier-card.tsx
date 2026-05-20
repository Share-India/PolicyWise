"use client"

import { motion } from "framer-motion"
import { type ScoringResult, getCurrentPremiumLoading } from "@/lib/scoring-engine"
import { Shield, ChevronRight, Info } from "lucide-react"

interface RiskTierCardProps {
  result: ScoringResult
}

export function RiskTierCard({ result }: RiskTierCardProps) {
  const getTierConfig = (tier: string) => {
    switch (tier) {
      case "A":
        return {
          gradient: "from-emerald-400 to-emerald-600",
          shadow: "shadow-emerald-200",
          textColor: "text-emerald-700",
          description: "Superior Resilience",
          status: "EXCELLENT",
          policyCard: {
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            title: "text-emerald-600",
            value: "text-emerald-700"
          }
        }
      case "B":
        return {
          gradient: "from-amber-400 to-amber-600", // Fixed: Was Blue
          shadow: "shadow-amber-200",
          textColor: "text-amber-700",
          description: "Solid Framework",
          status: "GOOD", // Changed from STABLE to GOOD (Amber)
          policyCard: {
            bg: "bg-amber-50",
            border: "border-amber-200",
            title: "text-amber-600",
            value: "text-amber-700"
          }
        }
      case "C":
        return {
          gradient: "from-orange-400 to-orange-600", // Distinct Orange
          shadow: "shadow-orange-200",
          textColor: "text-orange-700",
          description: "Active Gaps",
          status: "ELEVATED",
          policyCard: {
            bg: "bg-orange-50",
            border: "border-orange-200",
            title: "text-orange-600",
            value: "text-orange-700"
          }
        }
      case "D":
        return {
          gradient: "from-rose-500 to-red-700",
          shadow: "shadow-red-200",
          textColor: "text-red-700",
          description: "Critical Deficit",
          status: "POOR",
          policyCard: {
            bg: "bg-red-50",
            border: "border-red-200",
            title: "text-red-600",
            value: "text-red-700"
          }
        }
      default:
        return {
          gradient: "from-slate-400 to-slate-600",
          shadow: "shadow-slate-200",
          textColor: "text-slate-700",
          description: "Processing...",
          status: "PENDING",
          policyCard: {
            bg: "bg-slate-50",
            border: "border-slate-200",
            title: "text-slate-500",
            value: "text-slate-700"
          }
        }
    }
  }

  const config = getTierConfig(result.riskTier)

  // Font size calculation for Policy Load to prevent cutoff
  const getLoadFontSize = (text: string) => {
    if (text.length > 20) return "text-base tracking-tight"
    if (text.length > 12) return "text-lg tracking-tight"
    if (text.length > 8) return "text-2xl tracking-tight"  // Reduced from 3xl/xl mixture
    return "text-3xl tracking-tight" // For short text like "Declined"
  }

  return (
    <motion.div
      className="relative overflow-hidden p-8 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 group si-interactive"
      whileHover={{ y: -5, borderColor: "rgba(45, 169, 255, 0.4)" }}
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg shadow-black/10`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-outfit">Risk Classification</span>
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black text-white bg-gradient-to-r ${config.gradient} shadow-lg shadow-black/10 tracking-widest uppercase`}>
            {config.status}
          </div>
        </div>

        <div className="flex items-end gap-6 mb-8">
          <motion.div
            className={`text-8xl font-black leading-none font-outfit bg-clip-text text-transparent bg-gradient-to-br ${config.gradient}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {result.riskTier}
          </motion.div>
          <div className="pb-2 flex flex-col">
            <span className={`text-xl font-black tracking-tight ${config.textColor}`}>{config.description}</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] leading-none mt-1.5">Tier Assignment</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Score Matrix</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-si-navy font-outfit">{result.totalScore.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">/ 100</span>
            </div>
          </div>

          {/* Dynamically Styled Risk Profile Card */}
          <div className={`p-4 rounded-2xl border ${config.policyCard.bg} ${config.policyCard.border}`}>
            <span className={`block text-[9px] font-black uppercase tracking-[0.2em] mb-2 ${config.policyCard.title}`}>Determined Outcome</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-black font-outfit ${config.policyCard.value} ${getLoadFontSize(getCurrentPremiumLoading(result.riskTier))}`}>
                {getCurrentPremiumLoading(result.riskTier)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between text-slate-400 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 cursor-help group-hover:text-si-blue-primary transition-colors">
            <Info className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">Protocol Methodology</span>
          </div>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform group-hover:text-si-blue-primary" />
        </div>
      </div>

      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${config.gradient} opacity-[0.15] blur-3xl -mr-16 -mt-16 group-hover:opacity-25 transition-opacity`} />
    </motion.div>
  )
}

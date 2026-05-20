"use client"

import { motion } from "framer-motion"
import { type ScoringResult, getCurrentPremiumLoading } from "@/lib/scoring-engine"
import { ShieldCheck, ShieldAlert, ShieldX, Activity } from "lucide-react"

interface DecisionBadgeProps {
  result: ScoringResult
}

export function DecisionBadge({ result }: DecisionBadgeProps) {
  const getDecisionConfig = (tier: string, autoDeclined: boolean) => {
    if (autoDeclined) {
      return {
        gradient: "from-rose-500 to-red-700",
        shadow: "shadow-red-200",
        textColor: "text-rose-400",
        icon: ShieldX,
        label: "AUTO-DECLINED",
        description: "STRUCTURAL RISK INHIBITOR",
      }
    }

    switch (tier) {
      case "A":
        return {
          gradient: "from-emerald-400 to-emerald-600",
          shadow: "shadow-emerald-200",
          textColor: "text-emerald-400",
          icon: ShieldCheck,
          label: "APPROVED - TIER A",
          description: "OPTIMAL RISK PROFILE",
        }
      case "B":
        return {
          gradient: "from-amber-400 to-amber-600",
          shadow: "shadow-amber-200",
          textColor: "text-amber-400",
          icon: ShieldCheck,
          label: "APPROVED - TIER B",
          description: "STANDARD RISK PROFILE",
        }
      case "C":
        return {
          gradient: "from-orange-400 to-orange-600",
          shadow: "shadow-orange-200",
          textColor: "text-orange-400",
          icon: ShieldAlert,
          label: "APPROVED - TIER C",
          description: "SUBSTANDARD RISK PROFILE",
        }
      case "D":
        return {
          gradient: "from-rose-500 to-red-700",
          shadow: "shadow-red-200",
          textColor: "text-rose-400",
          icon: ShieldX,
          label: "POLICY DECLINED",
          description: "INADEQUATE RISK CONTROLS",
        }
      default:
        return {
          gradient: "from-slate-400 to-slate-600",
          shadow: "shadow-slate-200",
          textColor: "text-slate-300",
          icon: Activity,
          label: "ANALYZING...",
          description: "SIMULATION IN PROGRESS",
        }
    }
  }

  const config = getDecisionConfig(result.riskTier, result.autoDeclined)
  const IconComponent = config.icon

  return (
    <motion.div
      className={`p-[1px] rounded-3xl bg-gradient-to-br ${config.gradient} shadow-2xl shadow-black/60 relative`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="bg-si-navy-deep rounded-[calc(1.5rem-1px)] p-8 relative overflow-hidden border border-white/5">
        <div className="flex items-center gap-6 mb-8 relative z-10">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-2xl shadow-black/80`}>
            <IconComponent className="w-10 h-10 text-white" />
          </div>
          <div>
            <div className={`text-2xl font-black italic tracking-tighter uppercase font-outfit ${config.textColor}`}>{config.label}</div>
            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">{config.description}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-white/5 relative z-10">
          <div>
            <span className="block text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Technical Risk Score</span>
            <span className={`text-4xl font-black font-outfit ${config.textColor}`}>{result.totalScore.toFixed(2)}%</span>
          </div>
          <div className="text-right">
            <span className="block text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Determined Risk Tier</span>
            <span className={`text-4xl font-black italic font-outfit ${config.textColor}`}>{result.riskTier}</span>
          </div>
        </div>

        {/* Decorative background element */}
        <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${config.gradient} opacity-[0.08] blur-3xl -mr-24 -mt-24`} />
      </div>
    </motion.div>
  )
}

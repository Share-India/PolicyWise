"use client"

import type { Domain, ScoringResult } from "@/lib/scoring-engine"
import { motion } from "framer-motion"
import { RiskTierCard } from "./risk-tier-card"
import { Activity, AlertCircle, BarChart3, Layers } from "lucide-react"
import { useUnderwriting } from "@/context/underwriting-context"

interface RiskEngineProps {
  result: ScoringResult
  domains: Domain[]
}

export function RiskEngine({ result, domains }: RiskEngineProps) {
  const { isAdmin } = useUnderwriting()

  return (
    <div className="h-full flex flex-col font-inter relative">
      {/* Premium Header - Glass Effect */}
      <div className="p-8 border-b border-white/20 bg-white/40 backdrop-blur-md">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-2.5 bg-white/80 border border-white/50 rounded-xl shadow-lg backdrop-blur-sm">
            <Activity className="w-6 h-6 text-si-blue-primary" />
          </div>
          <h2 className="text-2xl font-black text-si-navy tracking-tight uppercase font-outfit">Analytics Engine</h2>
        </div>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">Real-time Deterministic Scoring</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12 scroll-smooth scrollbar-hide bg-white/20">
        {/* Tier Assignment Card */}
        <RiskTierCard result={result} />

        {/* Auto-Decline/Warning Banner */}
        {result.autoDeclined && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-2xl bg-si-red/10 border border-si-red/30 overflow-hidden relative shadow-2xl shadow-si-red/10 backdrop-blur-sm"
          >
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-2.5 bg-si-red rounded-xl shadow-lg shadow-si-red/30 animate-pulse">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{isAdmin ? "Protocol Violation Triggered" : "Operational Vulnerability Detected"}</h3>
                <p className="text-[10px] text-si-navy/80 font-medium mt-1 leading-relaxed">
                  {isAdmin
                    ? "Multiple critical inhibitor failures detected. Simulation terminated per formal underwriting guidelines."
                    : "Multiple critical security failures detected. Assessment results indicate significant risk posture issues."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.failedKillers.slice(0, 3).map((killer) => (
                    <span key={killer.id} className="text-[8px] font-black bg-si-red/20 text-si-navy px-2.5 py-1 rounded-lg border border-si-red/10 uppercase tracking-widest">
                      {killer.id}
                    </span>
                  ))}
                  {result.failedKillers.length > 3 && (
                    <span className="text-[8px] font-black text-si-navy/50 uppercase tracking-widest">+{result.failedKillers.length - 3} MORE</span>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-si-red/10 blur-3xl -mr-16 -mt-16 pointer-events-none" />
          </motion.div>
        )}

        {/* Domain Breakdown Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-si-blue-primary" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Breakdown</span>
            </div>
            <Layers className="w-4 h-4 text-slate-300" />
          </div>

          <div className="grid gap-5">
            {result.domainScores.map((domain, idx) => (
              <motion.div
                key={domain.domain}
                className="glass-card p-5 group/item cursor-pointer border-white/40 hover:border-si-blue-primary/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black text-si-navy uppercase tracking-tight font-outfit group-hover/item:text-si-blue-primary transition-colors">
                      {domain.domain}
                    </h4>
                    <div className="flex items-center gap-5 mt-2">
                      {isAdmin && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">IMPACT:</span>
                            <span className="text-[9px] text-si-blue-primary font-black uppercase tracking-widest">{domain.contribution.toFixed(2)} PTS</span>
                          </div>
                          <div className="h-1 w-1 rounded-full bg-slate-300" />
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">WGT:</span>
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{domain.activeWeight}%</span>
                          </div>
                        </>
                      )}
                      {!isAdmin && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Confidence Rating</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-black font-outfit ${domain.score >= 80 ? "text-emerald-500" : domain.score >= 50 ? "text-si-blue-primary" : "text-si-red"}`}>
                      {domain.score.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="relative h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${domain.score >= 80 ? "bg-emerald-500" : domain.score >= 50 ? "bg-si-blue-primary" : "bg-si-red"
                      }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(domain.score, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

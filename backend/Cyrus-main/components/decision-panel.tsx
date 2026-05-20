"use client"

import { useState } from "react"
import type { ScoringResult } from "@/lib/scoring-engine"
import { DecisionBadge } from "./decision-badge"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, Terminal, HelpCircle, FileText, ChevronDown, ArrowUpRight } from "lucide-react"
import type { Domain } from "@/lib/scoring-engine"
import { useUnderwriting } from "@/context/underwriting-context"
import { siteConfig } from "@/lib/site-config"

interface DecisionPanelProps {
  result: ScoringResult
  domains: Domain[]
  completionPercentage: number
  onNavigateToDomain: (domainId: string) => void
}

export function DecisionPanel({ result, domains, completionPercentage, onNavigateToDomain }: DecisionPanelProps) {
  const { isAdmin, selectedIndustry, clientName, userProfile } = useUnderwriting()
  const [expandedReasons, setExpandedReasons] = useState<boolean>(true)
  const isProvisional = completionPercentage < 100

  // Calculate Top 3 Risk Drivers
  const riskDrivers = [
    // 1. Failed Killers (Highest Priority)
    ...result.failedKillers.map(k => ({
      type: "critical",
      domainId: domains.find(d => d.name === k.domain)?.id || "",
      text: isAdmin ? `Killer Failure: ${k.text}` : `Structural Maturity Gap: ${k.text}`,
      score: 0
    })),
    // 2. Lowest Scoring Domains (Weighted)
    ...result.domainScores
      .filter(d => d.earnedScore < d.maxScore * 0.7) // Only show if < 70%
      .sort((a, b) => (a.earnedScore / a.maxScore) - (b.earnedScore / b.maxScore))
      .map(d => ({
        type: "warning",
        domainId: domains.find(domain => domain.name === d.domain)?.id || "",
        text: `Low Performance: ${d.domain} (${Math.round((d.earnedScore / d.maxScore) * 100)}%)`,
        score: d.earnedScore
      }))
  ].slice(0, 3)

  const getReasons = (): string[] => {
    const reasons: string[] = []

    if (result.autoDeclined) {
      reasons.push("Simulation terminated due to multiple critical inhibitor failures.")
      return reasons
    }

    if (result.declineNarrative) {
      reasons.push(result.declineNarrative)
    }

    if (result.totalScore < 60) {
      reasons.push("Aggregation threshold failure: Controls fell below the 'minimum standard' of 60 points.")
    }

    const weakDomains = result.domainScores.filter((d) => d.score < 50)
    if (weakDomains.length > 0) {
      reasons.push(`Unacceptable volatility in: ${weakDomains.map((d) => d.domain).join(", ")}`)
    }

    if (result.riskTier === "B") {
      reasons.push("Tier B detected: Substandard risk posture identified.")
    } else if (result.riskTier === "C") {
      reasons.push("Tier C detected: High risk volatility observed.")
    }

    return reasons.slice(0, 4)
  }

  const reasons = getReasons()

  return (
    <div className="h-full flex flex-col font-inter bg-white/40">
      {/* Premium Header */}
      <div className="p-8 border-b border-white/20 bg-white/40 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-si-blue-primary text-white rounded-xl shadow-lg shadow-si-blue-primary/20">
            <Terminal className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-si-navy tracking-tight uppercase font-outfit">Decision Protocol</h2>
          </div>
          {isProvisional && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-200 animate-pulse">
              Provisional
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">Deterministic Underwriting Output</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12 scroll-smooth scrollbar-hide">
        {/* Big Decision Badge */}
        <DecisionBadge result={result} />

        {/* Narrative Factors */}
        <div className="space-y-8">
          <button
            onClick={() => setExpandedReasons(!expandedReasons)}
            className="flex items-center justify-between w-full px-2 group/btn"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-si-blue-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Underwriting Rationale</span>
            </div>
            <motion.div animate={{ rotate: expandedReasons ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover/btn:text-si-blue-primary transition-colors" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedReasons && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {reasons.length > 0 ? (
                  reasons.map((reason, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-4 p-5 rounded-2xl bg-white/60 border border-white/50 group/reason cursor-pointer hover:bg-white/80 transition-all shadow-sm"
                    >
                      <AlertCircle size={18} className="text-si-blue-primary mt-1 flex-shrink-0 opacity-80 group-hover/reason:opacity-100 transition-opacity" />
                      <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{reason}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/50 text-center backdrop-blur-sm">
                    <p className="text-[11px] text-emerald-700 font-black uppercase tracking-widest">No Adverse Volatility Detected</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Top Risk Drivers (Interactive) */}
        {riskDrivers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Top Risk Drivers</h4>
            <div className="space-y-2">
              {riskDrivers.map((driver, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => onNavigateToDomain(driver.domainId)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 group ${driver.type === "critical"
                    ? "bg-red-50/50 border-red-100 hover:border-red-300 backdrop-blur-sm"
                    : "bg-amber-50/50 border-amber-100 hover:border-amber-300 backdrop-blur-sm"
                    }`}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${driver.type === "critical" ? "text-si-red" : "text-amber-600"
                      }`}>
                      {driver.type === "critical" ? (isAdmin ? "KILLER CONTROL" : "CRITICAL FAILURE") : "ATTENTION NEEDED"}
                    </span>
                    <ArrowUpRight className={`w-3 h-3 ${driver.type === "critical" ? "text-si-red" : "text-amber-600"
                      } opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <p className="text-xs font-bold text-si-navy mt-1 line-clamp-2">
                    {driver.text}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Export Actions (End User Download) */}
        {!isProvisional && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Export Risk Profile</h4>
            <button
              onClick={async () => {
                const { downloadPDFSummary } = await import('@/lib/pdf-report-generator');
                const { INDUSTRY_PROFILES } = await import('@/lib/scoring-engine');
                const industryName = INDUSTRY_PROFILES.find(p => p.id === selectedIndustry)?.name || selectedIndustry;
                
                downloadPDFSummary(
                  result,
                  domains,
                  clientName || userProfile?.organization_name || userProfile?.name || 'Unknown Client',
                  industryName,
                  userProfile?.email || '',
                  new Date().toISOString(), // Submission Date (approximate for end user view if not fetched)
                  'CYRUS-' + Date.now().toString().slice(-6), // Dummy ID since we don't have submission ID here
                  null, // No AI Remediation Plan for End User generated dynamically
                  '2.0.0', // Model version
                  new Date().toISOString()
                );
              }}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-si-navy to-si-blue-primary text-white hover:from-si-blue-primary hover:to-cyan-500 rounded-xl transition-all shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest text-white">Download Risk Binder</p>
                  <p className="text-[9px] font-medium text-white/70 uppercase tracking-widest">Official PDF Summary</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
            </button>
          </div>
        )}

        {/* Methodology Info */}
        <div className="p-6 rounded-2xl bg-si-navy shadow-xl shadow-si-navy/20 border border-white/10 relative overflow-hidden group">
          <div className="relative z-10 flex items-start gap-4">
            <HelpCircle className="w-6 h-6 text-si-blue-primary flex-shrink-0" />
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1.5 font-outfit">CYRUS ENGINE v2.0</h4>
              <p className="text-[10px] text-white/70 font-bold leading-relaxed uppercase tracking-tighter">
                Explainable AI Layer processing 96 discrete risk metrics across 19 critical infrastructure domains.
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-si-blue-primary/10 blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-si-blue-primary/20 transition-colors" />
        </div>
      </div>

      {/* Corporate Footer Branded */}
      <div className="p-6 border-t border-white/20 text-center bg-white/40 backdrop-blur-md">
        <p className="text-[11px] font-black text-si-navy uppercase tracking-[0.4em] mb-2 leading-none">
          {siteConfig.company}
        </p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
          IRDAI Licensed Direct Insurance Broker (Composite)
        </p>
      </div>
    </div>
  )
}

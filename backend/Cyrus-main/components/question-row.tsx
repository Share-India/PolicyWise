"use client"

import type { UnderwritingQuestion } from "@/lib/scoring-engine"
import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useUnderwriting } from "@/context/underwriting-context"

interface QuestionRowProps {
  question: UnderwritingQuestion
  onResponseChange: (value: number) => void
  onKillerToggle: (isKiller: boolean) => void
}

export function QuestionRow({ question, onResponseChange, onKillerToggle }: QuestionRowProps) {
  const questionWeight = question.isKiller ? 5 : 1
  const weightedScore = question.response * questionWeight
  const { isAdmin } = useUnderwriting()

  return (
    <motion.div
      className={`p-6 rounded-2xl border backdrop-blur-md shadow-sm transition-all duration-300 group/row relative overflow-hidden ${(question.isKiller && isAdmin)
        ? "border-si-red/40 bg-si-red/[0.03] hover:bg-si-red/[0.05] hover:border-si-red hover:shadow-si-red/10"
        : "border-white/60 bg-white/40 hover:border-si-blue-primary/30 hover:shadow-lg"
        }`}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between gap-5 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg tracking-widest uppercase border shadow-sm ${(question.isKiller && isAdmin)
              ? "text-si-red bg-white border-si-red/20"
              : "text-si-blue-primary bg-white/80 border-si-blue-primary/10"
              }`}>
              {question.id}
            </span>
            {question.isKiller && isAdmin && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-si-red text-white">
                <Zap className="w-2.5 h-2.5 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-tighter">Killer Control</span>
              </div>
            )}
          </div>
          <p className="text-[14px] text-si-navy font-bold font-outfit leading-relaxed transition-colors tracking-tight">
            {question.text}
          </p>
        </div>
      </div>

      {/* Response Control */}
      <div className="mt-6 flex items-center justify-between gap-8 relative z-10">
        <div className="flex-1">
          {question.type === "binary" ? (
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-white/50 backdrop-blur-sm w-fit max-w-full gap-1">
              {question.options?.map((opt) => {
                let activeClass = ""
                let hoverClass = ""

                if (opt.label === "Yes" || opt.label === "YES") {
                  activeClass = question.response === opt.value ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]" : "text-slate-400 hover:text-emerald-600 hover:bg-white/60"
                } else if (opt.label === "No" || opt.label === "NO") {
                  activeClass = question.response === opt.value ? "bg-si-red text-white shadow-lg shadow-si-red/25 scale-[1.02]" : "text-slate-400 hover:text-si-red hover:bg-white/60"
                } else if (opt.label === "N/A" || opt.label === "Not Applicable") {
                  activeClass = question.response === opt.value ? "bg-si-blue-primary text-white shadow-lg shadow-si-blue-primary/25 scale-[1.02]" : "text-slate-400 hover:text-si-blue-primary hover:bg-white/60"
                }

                return (
                  <button
                    key={opt.label}
                    onClick={() => onResponseChange(question.response === opt.value ? -1 : opt.value)}
                    className={`px-6 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all duration-300 transform min-h-[44px] min-w-[80px] flex items-center justify-center gap-2 ${activeClass}`}
                    aria-pressed={question.response === opt.value}
                  >
                    {opt.label.toUpperCase()}
                  </button>
                )
              })}
              {/* Fallback for legacy binary structure without options */}
              {!question.options && (
                <>
                  <button
                    onClick={() => onResponseChange(question.response === 1 ? -1 : 1)}
                    className={`flex-1 px-6 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all duration-300 transform min-h-[44px] min-w-[100px] flex items-center justify-center gap-2 ${question.response === 1
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]"
                      : "text-slate-400 hover:text-emerald-600 hover:bg-white/60"
                      }`}
                  >
                    YES
                  </button>
                  <button
                    onClick={() => onResponseChange(question.response === 0 ? -1 : 0)}
                    className={`flex-1 px-6 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all duration-300 transform min-h-[44px] min-w-[100px] flex items-center justify-center gap-2 ${question.response === 0
                      ? "bg-si-red text-white shadow-lg shadow-si-red/25 scale-[1.02]"
                      : "text-slate-400 hover:text-si-red hover:bg-white/60"
                      }`}
                  >
                    NO
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="flex-1 relative group/select max-w-sm">
                <select
                  value={question.response <= 0 ? "" : question.response}
                  onChange={(e) => {
                    const val = e.target.value
                    onResponseChange(val === "" ? -1 : Number.parseFloat(val))
                  }}
                  className={`w-full pl-5 pr-10 py-3 rounded-xl border text-[11px] font-black focus:outline-none focus:ring-2 focus:ring-si-blue-primary/20 transition-all appearance-none cursor-pointer min-h-[48px] shadow-sm ${question.response > -1
                    ? "bg-white border-si-blue-primary text-si-navy shadow-md"
                    : "bg-white/50 border-white/60 text-slate-400 hover:border-slate-300"
                    }`}
                  aria-label="Select maturity level"
                >
                  <option value="">Select maturity level...</option>
                  {question.options?.filter(opt => opt.value !== 0).map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-si-navy">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-si-blue-primary transition-colors text-[10px]">
                  ▼
                </div>
              </div>

              <div className="bg-slate-100/50 p-1 rounded-xl border border-white/50 backdrop-blur-sm">
                <button
                  onClick={() => onResponseChange(question.response === 0 ? -1 : 0)}
                  className={`px-6 py-3 rounded-lg text-[11px] font-black tracking-widest transition-all duration-300 transform min-h-[44px] ${question.response === 0
                    ? "bg-si-red text-white shadow-lg shadow-si-red/25 scale-[1.02]"
                    : "text-slate-400 hover:text-si-red hover:bg-white/60"
                    }`}
                  aria-pressed={question.response === 0}
                >
                  NO
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Score Display - Restricted to Admin */}
        {isAdmin && (
          <div className="flex flex-col items-end min-w-[90px] bg-white/40 px-3 py-2 rounded-lg border border-white/60 backdrop-blur-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Impact</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black font-outfit ${weightedScore > 0 ? "text-si-blue-primary" : "text-slate-300"}`}>
                {weightedScore.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

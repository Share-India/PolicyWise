"use client"

import type { Domain } from "@/lib/scoring-engine"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { useUnderwriting } from "@/context/underwriting-context"
import { QuestionRow } from "./question-row"
import { CertRelevancyChart } from "./cert-relevancy-chart"

interface ControlsPanelProps {
  domains: Domain[]
  expandedDomains: Set<string>
  onDomainToggle: (domainId: string) => void
  onQuestionChange: (domainId: string, questionId: string, response: number) => void
  onKillerToggle: (domainId: string, questionId: string, isKiller: boolean) => void
}

export function ControlsPanel({
  domains,
  expandedDomains,
  onDomainToggle,
  onQuestionChange,
  onKillerToggle,
}: ControlsPanelProps) {
  const { isAdmin, selectedIndustry } = useUnderwriting()

  return (
    <div className="flex flex-col font-inter relative">
      <div className="space-y-6 pb-20">
        {domains.map((domain) => (
          <motion.div
            key={domain.id}
            id={`domain-${domain.id}`}
            className={`rounded-3xl border transition-all duration-300 overflow-hidden scroll-mt-32 ${expandedDomains.has(domain.id)
              ? "bg-white/80 backdrop-blur-md border-si-blue-primary/20 shadow-xl shadow-si-blue-primary/5 lazy-glass"
              : "bg-white/60 backdrop-blur-sm border-white/40 hover:border-si-blue-primary/30 hover:shadow-lg hover:-translate-y-1"
              }`}
            initial={false}
          >
            <button
              onClick={() => onDomainToggle(domain.id)}
              className="w-full flex items-center justify-between p-6 text-left group/domain relative overflow-hidden"
            >
              {/* Progress background bar for closed state */}
              {!expandedDomains.has(domain.id) && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-si-blue-primary/20"
                  style={{ width: `${(domain.questions.filter(q => q.response !== -1).length / domain.questions.length) * 100}%` }}
                />
              )}

              <div className="relative z-10 flex-1 min-w-0">
                <h4 className={`font-black font-outfit uppercase tracking-tight text-lg transition-colors break-words ${expandedDomains.has(domain.id) ? "text-si-blue-primary" : "text-si-navy group-hover/domain:text-si-blue-primary"}`}>
                  {domain.name}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${domain.questions.filter(q => q.response !== -1).length === domain.questions.length
                    ? "text-emerald-500"
                    : "text-slate-400"
                    }`}>
                    {domain.questions.filter(q => q.response !== -1).length}/{domain.questions.length} COMPLETED
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] font-black text-si-blue-primary uppercase tracking-widest bg-si-blue-primary/5 px-2 py-0.5 rounded">
                      WEIGHT: {domain.activeWeight}%
                    </span>
                  )}
                </div>
              </div>

              <motion.div
                animate={{ rotate: expandedDomains.has(domain.id) ? 180 : 0 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${expandedDomains.has(domain.id)
                  ? "bg-si-blue-primary text-white shadow-lg shadow-si-blue-primary/30"
                  : "bg-white text-slate-400 group-hover/domain:text-si-blue-primary shadow-sm"}`}
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </button>

            <AnimatePresence>
              {expandedDomains.has(domain.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-si-blue-primary/5"
                >
                  <div className="p-6 md:p-8 space-y-6">
                    {domain.name === "Certifications" && (
                      <CertRelevancyChart selectedIndustryId={selectedIndustry} />
                    )}
                    {domain.explanation && (
                      <div className="mb-6 bg-si-blue-primary/5 rounded-xl p-4 border border-si-blue-primary/10">
                        <p className="text-xs font-medium text-si-navy/70 leading-relaxed flex gap-3">
                          <span className="text-si-blue-primary text-lg">ⓘ</span>
                          {domain.explanation}
                        </p>
                      </div>
                    )}
                    {domain.questions.map((question) => (
                      <QuestionRow
                        key={question.id}
                        question={question}
                        onResponseChange={(response) => onQuestionChange(domain.id, question.id, response)}
                        onKillerToggle={(isKiller) => onKillerToggle(domain.id, question.id, isKiller)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

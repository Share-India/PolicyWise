"use client"

import { motion } from "framer-motion"
import { Check, Circle, Loader2 } from "lucide-react"

interface FlowStepperProps {
    currentStep: number // 1: Controls, 2: Scoring, 3: Tier, 4: Decision
    completionPercentage: number
}

const steps = [
    { id: 1, label: "Controls Calibration" },
    { id: 2, label: "Risk Analysis" },
    { id: 3, label: "Tier Assignment" },
    { id: 4, label: "Decision Protocol" },
]

export function FlowStepper({ currentStep, completionPercentage }: FlowStepperProps) {
    return (
        <div className="w-full max-w-2xl mx-auto mb-6 px-6 relative z-10">
            <div className="relative flex justify-between items-center">
                {/* Background Line */}
                <div className="absolute top-[14px] left-0 right-0 h-[2px] bg-slate-200 -z-10" />

                {/* Progress Line */}
                <motion.div
                    className="absolute top-[14px] left-0 h-[2px] bg-si-blue-primary -z-10 origin-left"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(Math.min(currentStep, 4) - 1) * 33}%` }}
                    transition={{ duration: 0.8, type: "spring" }}
                />

                {steps.map((step) => {
                    const isCompleted = step.id < currentStep || (step.id === 4 && completionPercentage === 100)
                    const isCurrent = step.id === currentStep

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 group cursor-default">
                            <motion.div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative bg-white z-10 ${isCompleted
                                        ? "bg-si-blue-primary border-si-blue-primary text-white shadow-lg shadow-si-blue-primary/20"
                                        : isCurrent
                                            ? "border-si-blue-primary text-si-blue-primary shadow-xl ring-4 ring-si-blue-primary/10"
                                            : "bg-slate-50 border-slate-200 text-slate-300"
                                    }`}
                                animate={{ scale: isCurrent ? 1.1 : 1 }}
                            >
                                {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                ) : isCurrent ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <span className="text-[10px] font-black">{step.id}</span>
                                )}
                            </motion.div>
                            <span
                                className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${isCurrent || isCompleted ? "text-si-navy" : "text-slate-300"
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

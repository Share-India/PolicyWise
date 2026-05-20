"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ShieldCheck } from "lucide-react"

interface ReassuranceScreenProps {
    onDismiss: () => void
}

export function ReassuranceScreen({ onDismiss }: ReassuranceScreenProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-xl p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
                className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-[2rem] shadow-2xl shadow-si-blue-primary/20 border border-white/60 relative overflow-hidden text-center p-8 md:p-10"
            >
                {/* Background Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-si-blue-primary/10 to-transparent rounded-bl-full -mr-10 -mt-10 pointer-events-none blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-si-navy/5 to-transparent rounded-tr-full -ml-8 -mb-8 pointer-events-none blur-xl" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-8 text-si-blue-primary shadow-lg shadow-si-blue-primary/10 border border-white/50">
                        <ShieldCheck className="w-10 h-10" />
                    </div>

                    <h2 className="text-3xl font-black text-si-navy mb-4 font-outfit tracking-tight leading-tight">
                        Compliance Check
                    </h2>

                    <p className="text-slate-600 font-medium text-lg leading-relaxed mb-10">
                        “This questionnaire looks long — that’s normal for cyber insurance”
                    </p>

                    <motion.button
                        onClick={onDismiss}
                        whileHover={{ scale: 1.02, translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-si-navy hover:bg-si-blue-primary text-white rounded-xl font-black tracking-widest uppercase transition-all duration-300 shadow-xl shadow-si-navy/20 hover:shadow-si-blue-primary/30 flex items-center justify-center gap-3 group"
                    >
                        <span>Proceed to Assessment</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ease-out" />
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    )
}

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { siteConfig } from "@/lib/site-config"

export function PageLoader() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)

    // Trigger loading on route change
    useEffect(() => {
        setLoading(true)
        const timeout = setTimeout(() => setLoading(false), 300) // Reduced from 800ms for faster transitions
        return () => clearTimeout(timeout)
    }, [pathname, searchParams])

    return (
        <AnimatePresence mode="wait">
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-hidden"
                >
                    {/* Background gradient pulses */}
                    <div className="absolute inset-0 bg-slate-50" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute w-[800px] h-[800px] bg-si-blue-primary/5 rounded-full blur-[100px]"
                    />

                    <div className="relative">
                        {/* The Monogram Logo */}
                        <motion.div
                            initial={{ scale: 0.4, opacity: 0, y: 100, x: 100 }} // Starts roughly where the floating one is
                            animate={{
                                scale: [0.4, 2, 1.8],
                                opacity: 1,
                                y: 0,
                                x: 0,
                                filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                            }}
                            transition={{
                                duration: 0.8,
                                ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for "premium" feel
                                filter: { repeat: Infinity, duration: 1, ease: "easeInOut" } // Blinking effect
                            }}
                            className="relative"
                        >
                            <img
                                src="/share-india-monogram.png"
                                alt={siteConfig.name}
                                className="w-20 h-20 md:w-24 md:h-24 shadow-2xl rounded-2xl border-none"
                            />

                            {/* Inner pulse ring */}
                            <motion.div
                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                                className="absolute inset-0 border-2 border-si-blue-primary/30 rounded-2xl"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-center mt-12"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-si-navy/40">
                                {siteConfig.name} Risk Protocol
                            </span>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

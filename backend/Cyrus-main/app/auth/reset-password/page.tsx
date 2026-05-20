"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Lock, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react"

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            setIsLoading(false)
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.")
            setIsLoading(false)
            return
        }

        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            setError(error.message)
        } else {
            setIsSuccess(true)
        }
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-inter">
            <div className="w-full max-w-md space-y-12">
                <div className="text-center">
                    <img src="/share-india-new.png" alt="Share India" className="h-12 w-auto mx-auto mb-12" />
                    <h2 className="text-5xl font-black text-si-navy mb-4 tracking-tighter font-outfit">Reset Password.</h2>
                    <p className="text-lg text-slate-400 font-medium">Define your new authorization credentials.</p>
                </div>

                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-emerald-50 border border-emerald-100 p-8 rounded-[40px] text-center space-y-6"
                        >
                            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-emerald-800 font-outfit tracking-tight mb-2">Password Synchronized</h3>
                                <p className="text-sm text-emerald-600 font-medium font-inter">Your credentials have been updated. You can now use your new password to authorize.</p>
                            </div>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="w-full py-5 bg-si-navy text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-si-blue-primary transition-all"
                            >
                                Return to Login
                            </button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em] px-2">New Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-si-blue-primary transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Minimum 6 characters"
                                        className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-lg font-black text-si-navy focus:ring-8 focus:ring-si-blue-primary/5 focus:border-si-blue-primary focus:bg-white transition-all duration-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em] px-2">Confirm Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-si-blue-primary transition-colors" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat new password"
                                        className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-lg font-black text-si-navy focus:ring-8 focus:ring-si-blue-primary/5 focus:border-si-blue-primary focus:bg-white transition-all duration-500"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-xs font-bold text-si-red bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                                    <ShieldAlert className="w-4 h-4" /> {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-7 bg-si-navy text-white rounded-3xl font-black uppercase tracking-[0.4em] text-[11px] hover:bg-si-blue-primary transition-all duration-700 shadow-xl disabled:opacity-70 flex items-center justify-center gap-4 group"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        Update Credentials
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

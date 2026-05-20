"use client"

import { useState } from "react"
import { useUnderwriting } from "@/context/underwriting-context"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
    Lock,
    Shield,
    ArrowLeft,
    CheckCircle2,
    ShieldAlert,
    Save,
    KeyRound
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export default function SecuritySettingsPage() {
    const router = useRouter()
    const supabase = createClient()
    const { signOut, isLoading: contextLoading } = useUnderwriting()

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [resetSent, setResetSent] = useState(false)
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleForgotPassword = async () => {
        setIsResetting(true)
        setPasswordMessage(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user?.email) throw new Error("Could not identify user email.")

            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
            })

            if (error) throw error

            setResetSent(true)
            setPasswordMessage({ type: 'success', text: "Password reset link has been dispatched to your email." })
        } catch (error: any) {
            setPasswordMessage({ type: 'error', text: error.message || "Failed to initiate reset." })
        } finally {
            setIsResetting(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsChangingPassword(true)
        setPasswordMessage(null)

        if (!passwordData.currentPassword) {
            setPasswordMessage({ type: 'error', text: "Current password is required." })
            setIsChangingPassword(false)
            return
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: "Passwords do not match." })
            setIsChangingPassword(false)
            return
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: "Password must be at least 6 characters." })
            setIsChangingPassword(false)
            return
        }

        try {
            // 1. Get user email
            const { data: { user } } = await supabase.auth.getUser()
            if (!user?.email) throw new Error("Could not identify user session.")

            // 2. Verify current password by signing in again
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: passwordData.currentPassword
            })

            if (signInError) {
                throw new Error("Current password verification failed. Please try again.")
            }

            // 3. Update to new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            })

            if (updateError) throw updateError

            setPasswordMessage({ type: 'success', text: "Authorization credentials updated successfully." })
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })

            // Redirect back after success
            setTimeout(() => {
                router.push('/settings')
            }, 2000)
        } catch (error: any) {
            setPasswordMessage({ type: 'error', text: error.message || "Failed to update authorization credentials." })
        } finally {
            setIsChangingPassword(false)
        }
    }

    if (contextLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <Shield className="w-12 h-12 text-si-navy" />
                    <span className="text-xs font-black text-si-navy/40 uppercase tracking-widest">Loading Security...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-inter text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link
                        href="/settings"
                        className="p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-si-navy border border-transparent hover:border-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] block leading-none mb-1">Account Security</span>
                        <h2 className="text-lg font-black text-si-navy font-outfit uppercase tracking-tight">Authorization Phase</h2>
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-6 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-si-red hover:border-si-red/30 transition-all active:scale-95"
                >
                    <span>Exit Session</span>
                </button>
            </header>

            <main className="max-w-4xl mx-auto p-8 md:p-16">
                <div className="space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-2xl mx-auto space-y-4"
                    >
                        <div className="w-16 h-16 rounded-3xl bg-si-navy text-white flex items-center justify-center mx-auto shadow-2xl shadow-si-navy/20 mb-6">
                            <KeyRound className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black text-si-navy font-outfit tracking-tighter italic uppercase leading-none">
                            Update <br /> Credentials
                        </h1>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            For security purposes, you must verify your current credentials before establishing a new authorization phase.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white border border-slate-200 rounded-[48px] p-10 md:p-14 shadow-2xl shadow-slate-200/40"
                    >
                        <form onSubmit={handleChangePassword} className="space-y-10">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Password</label>
                                        <button
                                            type="button"
                                            onClick={handleForgotPassword}
                                            disabled={isResetting || resetSent}
                                            className="text-[10px] font-black text-si-blue-primary uppercase tracking-widest hover:text-si-navy transition-colors disabled:opacity-50"
                                        >
                                            {isResetting ? "Dispatching..." : resetSent ? "Reset link Sent" : "Forgot Password?"}
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        required={!resetSent}
                                        disabled={resetSent}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-[20px] px-6 py-4 outline-none focus:border-si-blue-primary/20 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300 disabled:opacity-50"
                                    />
                                </div>

                                {!resetSent && (
                                    <>
                                        <div className="h-px bg-slate-100" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">New Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    placeholder="••••••••"
                                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-[20px] px-6 py-4 outline-none focus:border-si-blue-primary/20 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    placeholder="••••••••"
                                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-[20px] px-6 py-4 outline-none focus:border-si-blue-primary/20 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col gap-6">
                                <AnimatePresence>
                                    {passwordMessage && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, y: 10 }}
                                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                                            exit={{ opacity: 0, height: 0, y: 10 }}
                                            className={`flex items-center gap-4 px-8 py-5 rounded-[24px] border-2 ${passwordMessage.type === 'success'
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                : 'bg-si-red/5 border-si-red/10 text-si-red'
                                                }`}
                                        >
                                            {passwordMessage.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <ShieldAlert className="w-6 h-6 shrink-0" />}
                                            <span className="text-xs font-black uppercase tracking-tight leading-tight">{passwordMessage.text}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!resetSent && (
                                    <button
                                        type="submit"
                                        disabled={isChangingPassword}
                                        className="group w-full bg-si-navy text-white py-6 rounded-[24px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-si-navy/20 hover:bg-si-blue-primary transition-all flex items-center justify-center gap-5 relative overflow-hidden disabled:opacity-50 active:scale-[0.98]"
                                    >
                                        <span className="relative z-10 text-sm">{isChangingPassword ? "Verifying Credentials..." : "Update Authorization Phase"}</span>
                                        {!isChangingPassword && <Save className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />}
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    </button>
                                )}

                                <Link
                                    href="/settings"
                                    className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-si-navy transition-colors py-2"
                                >
                                    Cancel & Return to Profile
                                </Link>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { useUnderwriting } from "@/context/underwriting-context"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
    Settings,
    Shield,
    Save,
    LogOut,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Trash2,
    ShieldCheck,
    AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export default function AdminSettingsPage() {
    const router = useRouter()
    const supabase = createClient()
    const {
        userProfile,
        isAdmin,
        updateProfile,
        isLoading: contextLoading,
    } = useUnderwriting()

    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState("")

    const [formData, setFormData] = useState({
        name: "",
        organization_name: "",
        phone: "",
        username: ""
    })

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || "",
                organization_name: userProfile.organization_name || "",
                phone: userProfile.phone || "",
                username: userProfile.username || ""
            })
        }
    }, [userProfile])

    // Safety check: redirect if not admin
    useEffect(() => {
        if (!contextLoading && !isAdmin) {
            router.push('/settings')
        }
    }, [contextLoading, isAdmin, router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setMessage(null)

        const result = await updateProfile(formData)

        if (result.success) {
            setMessage({ type: 'success', text: "Admin profile updated successfully." })
            setTimeout(() => setMessage(null), 3000)
        } else {
            setMessage({ type: 'error', text: result.error || "Update failed" })
        }
        setIsSaving(false)
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") {
            setMessage({ type: 'error', text: "Please type DELETE to confirm" })
            return
        }

        setIsDeleting(true)
        setMessage(null)

        try {
            const { error } = await supabase.rpc('delete_user_account')

            if (error) throw error

            await supabase.auth.signOut()
            window.location.href = '/login'
        } catch (error: any) {
            console.error('Delete account error:', error)
            setMessage({ type: 'error', text: error.message || "Failed to delete account" })
            setIsDeleting(false)
        }
    }

    if (contextLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <Settings className="w-12 h-12 text-si-navy" />
                    <span className="text-xs font-black text-si-navy/40 uppercase tracking-widest">Loading Console...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-inter text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-si-navy border-b border-white/5 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin"
                        className="p-3 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white border border-transparent hover:border-white/10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] block leading-none mb-1">System Admin</span>
                        <span className="text-sm font-black text-white font-outfit uppercase tracking-tight">Audit Console</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-6 py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-si-red hover:border-si-red transition-all active:scale-95"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Secure Exit</span>
                </button>
            </header>

            <main className="max-w-6xl mx-auto p-8 md:p-16">
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                    {/* Left Column: Context & Visuals */}
                    <div className="lg:col-span-5 space-y-10">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-si-navy text-white flex items-center justify-center shadow-2xl shadow-si-navy/20">
                                <Settings className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-si-navy font-outfit tracking-tighter italic mb-6 uppercase leading-[1.1]">
                                    Admin <br /> Profile
                                </h1>
                                <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                                    Manage your administrative access and credentials. Sensitive system configurations are handled in the main dashboard modules.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm space-y-6"
                        >
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-si-navy opacity-40" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Clearance</h3>
                            </div>
                            <div className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-black text-si-navy uppercase tracking-tight">
                                    Global Administrator
                                </span>
                                <div className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] bg-si-blue-primary text-white shadow-lg shadow-si-blue-primary/30">
                                    FULL ACCESS
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Interactive Form */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="bg-white border border-slate-200 rounded-[48px] p-10 md:p-14 shadow-2xl shadow-slate-200/50 space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder=""
                                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[20px] px-6 py-4 outline-none focus:border-si-blue-primary/20 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Username</label>
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                placeholder=""
                                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[20px] px-6 py-4 outline-none focus:border-si-blue-primary/20 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Organization Name</label>
                                            <input
                                                type="text"
                                                value={formData.organization_name}
                                                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                                                placeholder=""
                                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[20px] px-6 py-4 outline-none focus:border-si-blue-primary/20 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder=""
                                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[20px] px-6 py-4 outline-none focus:border-si-blue-primary/20 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6 pt-4">
                                        <AnimatePresence>
                                            {message && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0, y: 10 }}
                                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                    exit={{ opacity: 0, height: 0, y: 10 }}
                                                    className={`flex items-center gap-4 px-8 py-5 rounded-[24px] border-2 ${message.type === 'success'
                                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                        : 'bg-si-red/5 border-si-red/10 text-si-red'
                                                        }`}
                                                >
                                                    {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
                                                    <span className="text-xs font-black uppercase tracking-tight leading-tight">{message.text}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="group w-full bg-si-navy text-white py-6 rounded-[24px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-si-navy/30 hover:bg-si-blue-primary transition-all flex items-center justify-center gap-5 relative overflow-hidden disabled:opacity-50 active:scale-[0.98]"
                                        >
                                            <span className="relative z-10 text-sm">{isSaving ? "Synchronizing..." : "Update Admin Profile"}</span>
                                            {!isSaving && <Save className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />}
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        </button>
                                    </div>
                                </div>

                                {/* Account Management */}
                                <div className="bg-white border border-slate-200 rounded-[48px] p-10 md:p-14 shadow-lg space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-black text-slate-700 font-outfit uppercase tracking-tight">Admin Account Termination</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                Deleting this admin account will revoke all system access immediately.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="group px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-2xl font-bold text-sm border border-red-100 hover:border-red-200 transition-all flex items-center gap-3"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete Admin Account</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </section>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => {
                                setShowDeleteConfirm(false)
                                setDeleteConfirmText("")
                                setMessage(null)
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-[32px] p-8 md:p-12 max-w-lg w-full shadow-2xl"
                            >
                                {/* ... Same delete confirmation UI as client settings ... */}
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 font-outfit tracking-tight mb-2">
                                            Delete Admin Account?
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            This action is irreversible. You will lose all administrative privileges.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                                            Type <span className="font-black text-slate-700">DELETE</span> to confirm
                                        </label>
                                        <input
                                            type="text"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            placeholder=""
                                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-3.5 outline-none focus:border-red-400 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowDeleteConfirm(false)
                                                setDeleteConfirmText("")
                                                setMessage(null)
                                            }}
                                            className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting || deleteConfirmText !== "DELETE"}
                                            className="flex-1 px-6 py-4 bg-si-red hover:bg-red-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        >
                                            {isDeleting ? "Deleting..." : "Delete Account"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

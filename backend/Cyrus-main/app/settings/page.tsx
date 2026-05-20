"use client"

import { useState, useEffect } from "react"
import { useUnderwriting } from "@/context/underwriting-context"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
    User,
    Settings,
    Shield,
    Building2,
    Save,
    LogOut,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Globe,
    Trash2,
    AlertTriangle,
    Lock,
    ShieldAlert
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"

export default function SettingsPage() {
    const router = useRouter()
    const supabase = createClient()
    const {
        userProfile,
        isAdmin,
        updateProfile,
        signOut,
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
        organization_website: "",
        phone: "",
        industry: "",
        username: ""
    })


    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || "",
                organization_name: userProfile.organization_name || "",
                organization_website: userProfile.organization_website || "",
                phone: userProfile.phone || "",
                industry: userProfile.industry || "",
                username: userProfile.username || ""
            })
        }
    }, [userProfile])

    // Redirect admins to their specific settings page
    useEffect(() => {
        if (!contextLoading && isAdmin) {
            router.push('/admin/settings')
        }
    }, [contextLoading, isAdmin, router])



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setMessage(null)

        const result = await updateProfile(formData)

        if (result.success) {
            setMessage({ type: 'success', text: "Profile synchronization complete." })
            setTimeout(() => setMessage(null), 3000)
        } else {
            setMessage({ type: 'error', text: result.error || "failed_sync" })
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
            // Call the database function to delete the account
            const { error } = await supabase.rpc('delete_user_account')

            if (error) throw error

            // Sign out and redirect
            await signOut()
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
                    <span className="text-xs font-black text-si-navy/40 uppercase tracking-widest">Loading Settings...</span>
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
                        href="/welcome"
                        className="p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-si-navy border border-transparent hover:border-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] block leading-none mb-1">Account Console</span>
                        <h2 className="text-lg font-black text-si-navy font-outfit uppercase tracking-tight">Audit Summary</h2>
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-6 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-si-red hover:border-si-red/30 transition-all active:scale-95"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Exit Session</span>
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
                                    Profile <br /> Configuration
                                </h1>
                                <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                                    Manage your account details and settings within the audit framework. These details ensure accurate underwriting reports.
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
                                <Shield className="w-5 h-5 text-si-navy opacity-40" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Rights</h3>
                            </div>
                            <div className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-black text-si-navy uppercase tracking-tight">
                                    {isAdmin ? "Admin Analytics Portal" : "Risk Profile Dashboard"}
                                </span>
                                <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] ${isAdmin ? 'bg-si-blue-primary text-white shadow-lg shadow-si-blue-primary/30' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'}`}>
                                    {isAdmin ? 'FULL CLEARANCE' : 'STANDARD'}
                                </div>
                            </div>
                        </motion.div>
                        <AnimatePresence>
                            {!formData.phone && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    className="p-8 bg-si-red/5 border-2 border-si-red/20 rounded-[32px] space-y-4 shadow-xl shadow-si-red/5"
                                >
                                    <div className="flex items-center gap-4 text-si-red">
                                        <div className="w-10 h-10 rounded-xl bg-si-red text-white flex items-center justify-center shrink-0 animate-pulse">
                                            <ShieldAlert className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest leading-none mb-1">Critical Identity Gap</h3>
                                            <p className="text-[10px] font-bold opacity-70 uppercase tracking-tight">Your account lacks a verified mobile number</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-si-red/80 font-medium leading-relaxed">
                                        To ensure consistent access and enable SMS-based OTP verification, please add your mobile number below. This is now a mandatory requirement for the CYRUS network.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Organization Website</label>
                                            <input
                                                type="url"
                                                value={formData.organization_website}
                                                onChange={(e) => setFormData({ ...formData, organization_website: e.target.value })}
                                                placeholder="https://example.com"
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
                                        <div className="space-y-3 col-span-full">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Industry Vertical</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.industry}
                                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-[20px] px-6 py-4 outline-none focus:border-si-blue-primary/20 focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                                                >
                                                    <option value="">Select Industry</option>
                                                    {INDUSTRY_PROFILES.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                                    <Globe className="w-5 h-5" />
                                                </div>
                                            </div>
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
                                            <span className="relative z-10 text-sm">{isSaving ? "Saving Progress..." : "Update Profile Settings"}</span>
                                            {!isSaving && <Save className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />}
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        </button>
                                    </div>
                                </div>

                                {/* Security & Password */}
                                <div className="bg-white border border-slate-200 rounded-[48px] p-10 md:p-14 shadow-2xl shadow-slate-200/50 space-y-8">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-si-blue-primary/10 text-si-blue-primary flex items-center justify-center shrink-0">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-si-navy font-outfit uppercase tracking-tight">Security & Credentials</h3>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Manage your authorization phase</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between group">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</p>
                                            <p className="text-xs font-bold text-si-navy uppercase tracking-tight">Standard Encryption Enabled</p>
                                        </div>
                                        <Link
                                            href="/settings/security"
                                            className="px-6 py-3 bg-white border border-slate-200 text-si-navy rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-si-navy hover:text-white hover:border-si-navy transition-all shadow-sm active:scale-95"
                                        >
                                            Update Credentials
                                        </Link>
                                    </div>
                                </div>

                                {/* Account Management */}
                                <div className="bg-white border border-slate-200 rounded-[48px] p-10 md:p-14 shadow-lg space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-black text-slate-700 font-outfit uppercase tracking-tight">Account Management</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                If you no longer need this account, you can permanently delete it along with all associated data.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="group px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-700 rounded-2xl font-bold text-sm border border-slate-200 hover:border-slate-300 transition-all flex items-center gap-3"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete Account</span>
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
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 font-outfit tracking-tight mb-2">
                                            Delete Account?
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            This will permanently remove your account and all associated data.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">What will be removed:</p>
                                        <ul className="text-sm text-slate-600 space-y-1.5">
                                            <li className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-slate-400" />
                                                Account and login credentials
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-slate-400" />
                                                Assessment data and submissions
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-slate-400" />
                                                Profile and organization information
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                                            Type <span className="font-black text-slate-700">DELETE</span> to confirm
                                        </label>
                                        <input
                                            type="text"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            placeholder=""
                                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-3.5 outline-none focus:border-slate-400 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                            autoFocus
                                        />
                                    </div>

                                    {message && message.type === 'error' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-si-red/5 border-2 border-si-red/10 text-si-red"
                                        >
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <span className="text-xs font-black uppercase tracking-tight">{message.text}</span>
                                        </motion.div>
                                    )}

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
                                            className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                                    />
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    Delete Account
                                                </>
                                            )}
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

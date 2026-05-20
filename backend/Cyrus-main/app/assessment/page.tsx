"use client"

import { useState, useEffect, useCallback } from "react"
import { useUnderwriting } from "@/context/underwriting-context"
import { ControlsPanel } from "@/components/controls-panel"
import { ReassuranceScreen } from "@/components/reassurance-screen"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Save, Loader2, ShieldCheck, Settings, LogOut, FileText, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PolicyUpload } from "@/components/policy-upload"
import { createClient } from "@/lib/supabase/client"
import { downloadPDFSummary } from "@/lib/pdf-report-generator"
import { INDUSTRY_PROFILES, MODEL_VERSION } from "@/lib/scoring-engine"


export default function AssessmentPage() {
    const router = useRouter()
    const {
        domains,
        selectedIndustry,
        manualOverrideEnabled,
        setSelectedIndustry,
        setManualOverrideEnabled,
        handleDomainWeightChange,
        handleQuestionChange,
        handleKillerToggle,
        saveDraft,
        autoSaveDraft,
        submitAssessment,
        handleReset,
        result,
        clientName,
        completionStats,

        isLoading,
        isAdmin,
        isSaving,
        lastSavedTimestamp,
        signOut,
        userRole,
        userProfile
    } = useUnderwriting()

    const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
    const [showReassurance, setShowReassurance] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [submittedAssessmentId, setSubmittedAssessmentId] = useState<string | undefined>(undefined)
    const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
    const [policyStepDone, setPolicyStepDone] = useState(false)
    const [auditStepDone, setAuditStepDone] = useState(false)
    const [priorAuditAnswer, setPriorAuditAnswer] = useState<'yes' | 'no' | null>(null)

    // Fetch current user ID on mount, and check if policy already uploaded
    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(async ({ data }) => {
            if (data.user) {
                setCurrentUserId(data.user.id)
                // Check existing uploads to skip steps already completed
                const { data: docs } = await supabase
                    .from('policy_documents')
                    .select('document_type')
                    .eq('user_id', data.user.id)
                if (docs && docs.length > 0) {
                    setPolicyStepDone(true)
                    setAuditStepDone(true)
                }
            }
        })
    }, [])

    // Auto-expand first domain on load
    useEffect(() => {
        if (domains.length > 0 && expandedDomains.size === 0) {
            setExpandedDomains(new Set([domains[0].id]))
        }
    }, [domains, expandedDomains.size])

    // Reassurance Logic
    useEffect(() => {
        if (isLoading) return
        const sessionDismissed = sessionStorage.getItem("reassurance_dismissed")
        if (!sessionDismissed && completionStats.percentage === 0) {
            setShowReassurance(true)
        }
    }, [completionStats.percentage, isLoading])

    // Auth Guard - Force redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !userRole) {
            console.warn("Unauthorized bridge detected. Redirecting to Login Matrix.")
            router.push('/login')
        }
    }, [isLoading, userRole, router])

    // Auto-save effect (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            autoSaveDraft()
        }, 2000) // 2 second debounce

        return () => clearTimeout(timer)
    }, [domains, selectedIndustry, manualOverrideEnabled, autoSaveDraft])

    const handleDomainToggle = useCallback((domainId: string) => {
        setExpandedDomains((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(domainId)) {
                newSet.delete(domainId)
            } else {
                newSet.add(domainId)
            }
            return newSet
        })
    }, [])

    const onResetClick = async () => {
        if (window.confirm("Are you sure you want to reset the assessment? All progress will be lost and answers will be cleared.")) {
            await handleReset()
            // Force a hard navigation to bypass any cached memory state
            window.location.href = '/assessment?reset=true';
        }
    }

    const handleFinalize = async () => {
        if (completionStats.percentage < 100) {
            router.push("/dashboard")
            return
        }
 
        if (window.confirm("Ready to submit for official underwriting? This will finalize your risk assessment.")) {
            setIsSubmitting(true)
            try {
                const res = await submitAssessment()
                if (res && res.success) {
                    setSubmittedAssessmentId(res.assessmentId)
                    setSubmitted(true)
                } else {
                    alert(`Submission failed: ${res?.error || "Unknown Error"}`)
                }
            } catch (err: any) {
                console.error("Critical submission crash caught in UI:", err)
                alert(`A critical network error occurred: ${err.message || "Failed to fetch"}. Please check your connection and try again.`)
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    const [sessionMismatch, setSessionMismatch] = useState(false)

    // Auth Guard & Session Sync
    useEffect(() => {
        const supabase = createClient()
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user && userProfile && user.id !== userProfile.id) {
                setSessionMismatch(true)
            }
        }
        checkSession()
    }, [userProfile])

    if (sessionMismatch) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-inter">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-si-navy p-10 rounded-[40px] border border-white/10 text-center shadow-2xl"
                >
                    <div className="w-20 h-20 bg-si-red/20 rounded-[28px] flex items-center justify-center mx-auto mb-8 text-si-red">
                        <LogOut className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black font-outfit mb-4">Session Conflict Detected</h2>
                    <p className="text-white/60 text-sm leading-relaxed mb-8">
                        You have logged into a different account in another tab. To prevent accidental data contamination, this session has been locked.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-si-blue-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-si-blue-secondary transition-all"
                    >
                        Synchronize Session
                    </button>
                </motion.div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-inter">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-si-blue-primary/20 border-t-si-blue-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-si-navy rounded-full animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-si-navy font-outfit mb-2">Initializing Audit</h2>
                        <p className="text-sm text-slate-400 font-medium">Loading audit framework...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Pre-assessment policy upload step (shown after reassurance, before questionnaire)
    if (!isLoading && !showReassurance && !policyStepDone && currentUserId) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-12 rounded-[40px] shadow-2xl shadow-si-navy/10 max-w-2xl w-full border border-slate-100"
                >
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-si-blue-primary/10 rounded-[28px] flex items-center justify-center mx-auto mb-8">
                            <ShieldCheck className="w-10 h-10 text-si-blue-primary" />
                        </div>
                        <h1 className="text-3xl font-black text-si-navy font-outfit mb-4 tracking-tight">Before You Begin</h1>
                        <p className="text-base text-slate-500 font-medium leading-relaxed px-4">
                            Please upload your company's IT and/or Cyber Security Policy document. This helps our underwriting team assess your risk profile more accurately.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-[28px] p-8 border border-slate-100 mb-8">
                        <PolicyUpload
                            userId={currentUserId}
                            onUploadComplete={() => setPolicyStepDone(true)}
                        />
                    </div>

                    <button
                        onClick={() => setPolicyStepDone(true)}
                        className="w-full py-4 text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] hover:text-slate-600 transition-colors"
                    >
                        Skip for now
                    </button>
                </motion.div>
            </div>
        )
    }

    // Prior Audit Question Step (shown after policy upload, before questionnaire)
    if (!isLoading && !showReassurance && policyStepDone && !auditStepDone && currentUserId) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <AnimatePresence mode="wait">
                    {priorAuditAnswer === 'yes' ? (
                        <motion.div
                            key="upload-report"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white p-12 rounded-[40px] shadow-2xl shadow-si-navy/10 max-w-2xl w-full border border-slate-100"
                        >
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-si-blue-primary/10 rounded-[28px] flex items-center justify-center mx-auto mb-8">
                                    <FileText className="w-10 h-10 text-si-blue-primary" />
                                </div>
                                <h1 className="text-3xl font-black text-si-navy font-outfit mb-4 tracking-tight">Upload Audit Report</h1>
                                <p className="text-base text-slate-500 font-medium leading-relaxed px-4">
                                    Please upload your most recent Cyber Security Audit report. This provides critical context for our risk analysis.
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-[28px] p-8 border border-slate-100 mb-8">
                                <PolicyUpload
                                    userId={currentUserId}
                                    documentType="audit_report"
                                    onUploadComplete={() => setAuditStepDone(true)}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setPriorAuditAnswer(null)}
                                    className="px-8 py-4 bg-white border border-slate-200 text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-50 transition-all duration-300 flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                                <button
                                    onClick={() => setAuditStepDone(true)}
                                    className="flex-1 py-4 text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] hover:text-slate-600 transition-colors"
                                >
                                    Skip for now
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-12 rounded-[40px] shadow-2xl shadow-si-navy/10 max-w-2xl w-full border border-slate-100"
                        >
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-si-blue-primary/10 rounded-[28px] flex items-center justify-center mx-auto mb-8">
                                    <LayoutDashboard className="w-10 h-10 text-si-blue-primary" />
                                </div>
                                <h1 className="text-3xl font-black text-si-navy font-outfit mb-4 tracking-tight">Audit History</h1>
                                <p className="text-base text-slate-500 font-medium leading-relaxed px-4">
                                    Has your organization undergone a formal Cyber Security audit in the past 12 months?
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <button
                                    onClick={() => setPriorAuditAnswer('yes')}
                                    className="flex-1 py-6 bg-si-blue-primary text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-[28px] hover:bg-si-navy transition-all duration-300 shadow-xl shadow-si-blue-primary/20 group overflow-hidden relative"
                                >
                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                        <CheckCircle2 className="w-6 h-6 mb-1" />
                                        <span>Yes, audited</span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button
                                    onClick={() => setAuditStepDone(true)}
                                    className="flex-1 py-6 bg-slate-50 border border-slate-100 text-si-navy text-[13px] font-black uppercase tracking-[0.2em] rounded-[28px] hover:bg-slate-100 transition-all duration-300 group"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <Circle className="w-6 h-6 mb-1 text-slate-300" />
                                        <span>No, first time</span>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => setAuditStepDone(true)}
                                className="w-full py-4 text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] hover:text-slate-600 transition-colors"
                            >
                                Skip Step
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-12 rounded-[40px] shadow-2xl shadow-si-navy/10 max-w-2xl w-full border border-slate-100"
                >
                    <div className="text-center mb-10">
                        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-10">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <h1 className="text-4xl font-black text-si-navy font-outfit mb-6 tracking-tight">Assessment Submitted.</h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed px-8">
                            Your technical risk assessment has been securely transmitted. Our underwriting team will review the parameters and issue an official risk profile shortly.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => {
                                const industryName = INDUSTRY_PROFILES.find(p => p.id === selectedIndustry)?.name || ''
                                downloadPDFSummary(result, domains, clientName, industryName, '', lastSavedTimestamp || new Date().toISOString(), '', null, MODEL_VERSION, lastSavedTimestamp || new Date().toISOString())
                            }}
                            className="flex-1 py-4 bg-si-navy text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-si-blue-primary transition-all duration-300 shadow-xl shadow-si-navy/20 flex items-center justify-center gap-2 group"
                        >
                            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Download Summary
                        </button>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex-1 py-4 bg-si-blue-primary text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-si-navy transition-all duration-300 shadow-xl shadow-si-blue-primary/20 flex items-center justify-center gap-2"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            View Risk Analysis
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="py-4 bg-white border border-slate-200 text-si-navy text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-50 transition-all duration-300"
                        >
                            Return Home
                        </button>
                        <button
                            onClick={async () => {
                                if (window.confirm("Start a new assessment? This will clear current results.")) {
                                    await handleReset()
                                    window.location.href = "/assessment"
                                }
                            }}
                            className="py-4 bg-slate-50 border border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-100 transition-all duration-300"
                        >
                            New Assessment
                        </button>
                    </div>

                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent flex flex-col font-inter text-slate-900 font-medium tracking-tight">
            <AnimatePresence>
                {showReassurance && (
                    <ReassuranceScreen
                        onDismiss={() => {
                            setShowReassurance(false)
                            sessionStorage.setItem("reassurance_dismissed", "true")
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Simplified Header */}
            <header className="glass-panel sticky top-4 z-40 mx-4 rounded-2xl px-6 py-4 flex items-center justify-between mb-8 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <Link href="/welcome" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-si-navy">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] block mb-0.5">
                            {isAdmin ? "Audit Console" : "Insurance Audit"}
                        </span>
                        <span className="text-sm font-black text-si-navy font-outfit tracking-tight">
                            {isAdmin ? "Administrator Mode" : "Active Audit Session"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-si-blue-primary">{completionStats.percentage}% Audit Completion</span>
                        </div>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completionStats.percentage}%` }}
                                className="h-full bg-si-blue-primary shadow-[0_0_8px_rgba(42,126,254,0.4)]"
                            />
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <button
                            onClick={onResetClick}
                            className="text-[10px] font-black text-slate-400 hover:text-si-red uppercase tracking-widest px-4 py-2 hover:bg-white rounded-lg transition-all duration-200"
                        >
                            Reset
                        </button>
                        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                        <button
                            onClick={async () => {
                                const result = await saveDraft()
                                if (result.success) {
                                    alert("Progress saved successfully!")
                                } else {
                                    alert(`Save failed: ${result.error}`)
                                }
                            }}
                            className="text-slate-400 hover:text-si-blue-primary p-2 hover:bg-white rounded-lg transition-all duration-200 relative group"
                            title="Save Progress"
                        >
                            <Save className="w-5 h-5" />
                            {/* Save Status Indicator */}
                            {isSaving && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-si-navy text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap">
                                    Saving...
                                </div>
                            )}
                            {!isSaving && lastSavedTimestamp && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    Saved {new Date(lastSavedTimestamp).toLocaleTimeString()}
                                </div>
                            )}
                        </button>
                    </div>

                    {completionStats.percentage < 100 ? (
                        <button
                            onClick={handleFinalize}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-si-navy text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-si-blue-primary transition-all duration-300 shadow-xl shadow-si-navy/20 active:scale-95 group flex items-center gap-2"
                        >
                            Analyze Risk
                            <motion.span
                                animate={{ x: [0, 4, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                →
                            </motion.span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="hidden sm:flex px-6 py-2.5 bg-white border border-slate-200 text-si-navy text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-slate-50 transition-all duration-300 flex items-center gap-2"
                            >
                                Analyze Risk
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleFinalize}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-500 transition-all duration-300 shadow-xl shadow-emerald-500/20 active:scale-95 group flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Finalize & Submit
                                        <ShieldCheck className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <div className="w-[1px] h-6 bg-slate-100 hidden md:block" />

                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-si-red hover:border-si-red/30 transition-all active:scale-95"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden lg:inline">Exit Session</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
                {/* Left Rail: Navigation */}
                <div className="hidden lg:block col-span-3 sticky top-28 self-start h-fit max-h-[calc(100vh-10rem)] overflow-y-auto pr-4 custom-scrollbar">
                    <div className="mb-4 px-4 py-3 bg-slate-100/50 rounded-lg border border-slate-200/50 flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Navigation Map</span>
                        <span className="text-[9px] font-bold text-si-blue-primary/60 uppercase tracking-tight">System v{MODEL_VERSION}</span>
                    </div>
                    <nav className="space-y-1.5">
                        {domains.map((d, idx) => {
                            const answeredCount = d.questions.filter(q => q.response !== -1).length
                            const totalCount = d.questions.length
                            const isComplete = answeredCount === totalCount
                            const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0
                            const isActive = expandedDomains.has(d.id)

                            return (
                                <button
                                    key={d.id}
                                    onClick={() => {
                                        handleDomainToggle(d.id)
                                        // Defer scroll to next tick to allow React/DOM to process expansion
                                        setTimeout(() => {
                                            document.getElementById(`domain-${d.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                        }, 0)
                                    }}
                                    className={`w-full text-left px-5 py-4 rounded-xl flex flex-col gap-3 group transition-all duration-300 ease-out border ${isActive
                                        ? 'bg-si-blue-primary/5 border-si-blue-primary/20 shadow-[0_0_20px_rgba(45,169,255,0.15)] scale-[1.02]'
                                        : 'border-transparent hover:bg-white/50 hover:border-white/40 text-slate-500 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="w-full flex items-center justify-between">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-si-blue-primary' : isComplete ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {answeredCount}/{totalCount} COMPLETED
                                            </span>
                                            <span className={`text-xs font-bold font-outfit truncate ${isActive ? 'text-si-navy' : 'text-slate-600'}`}>
                                                {d.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isComplete ? (
                                                <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                </div>
                                            ) : (
                                                <div className="text-[10px] font-black font-mono text-slate-300">
                                                    {Math.round(progress)}%
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mini Progress Bar */}
                                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-si-blue-primary'}`}
                                        />
                                    </div>
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* Main Content: Questionnaire */}
                <div className="col-span-1 lg:col-span-9 space-y-8 pb-32">
                    <ControlsPanel
                        domains={domains}
                        expandedDomains={expandedDomains}
                        onDomainToggle={handleDomainToggle}
                        onQuestionChange={handleQuestionChange}
                        onKillerToggle={handleKillerToggle}
                    />
                </div>
            </main>
        </div>
    )
}

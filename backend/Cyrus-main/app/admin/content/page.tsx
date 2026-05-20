"use client"

import { useState } from "react"
import { useUnderwriting } from "@/context/underwriting-context"
import { ArrowLeft, Save, Plus, Trash2, Edit3, ShieldAlert, Layers, Scale, Zap, Info, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

export default function AdminContentPage() {
    const { domains, refreshData, isLoading, isAdmin } = useUnderwriting()
    const [isSaving, setIsSaving] = useState(false)
    const [expandedDomain, setExpandedDomain] = useState<string | null>(null)
    const [stagedKillers, setStagedKillers] = useState<Record<string, boolean>>({})
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <ShieldAlert className="w-12 h-12 text-si-red mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-si-navy">Access Denied</h1>
                    <p className="text-slate-500 mt-2">Only administrators can access the Command Console.</p>
                    <Link href="/" className="mt-6 inline-block px-6 py-2 bg-si-navy text-white rounded-xl">Return Home</Link>
                </div>
            </div>
        )
    }

    const handleUpdateQuestion = async (qId: string, updates: any) => {
        setIsSaving(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('questions')
            .update(updates)
            .eq('id', qId)

        if (error) alert("Error updating question: " + error.message)
        else await refreshData()
        setIsSaving(false)
    }

    const handleUpdateDomain = async (dId: string, updates: any) => {
        setIsSaving(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('domains')
            .update(updates)
            .eq('id', dId)

        if (error) alert("Error updating domain: " + error.message)
        else await refreshData()
        setIsSaving(false)
    }

    const handleKillerToggle = (qId: string, currentStatus: boolean) => {
        const newStatus = stagedKillers[qId] !== undefined ? !stagedKillers[qId] : !currentStatus
        setStagedKillers(prev => ({
            ...prev,
            [qId]: newStatus
        }))
        setHasUnsavedChanges(true)
    }

    const handleResetAllKillers = () => {
        const newStagedKillers = { ...stagedKillers }
        domains.forEach(domain => {
            domain.questions.forEach(q => {
                // If it's currently a killer, stage it to be false
                if (q.isKiller && stagedKillers[q.id] !== false) {
                    newStagedKillers[q.id] = false
                }
            })
        })

        // If there were any killers to reset, set the changes
        if (Object.keys(newStagedKillers).length > Object.keys(stagedKillers).length) {
            setStagedKillers(newStagedKillers)
            setHasUnsavedChanges(true)
        }
    }


    const handleSaveRiskConfiguration = async () => {
        setIsSaving(true)
        const supabase = createClient()

        try {
            const updates = Object.entries(stagedKillers).map(([id, is_killer]) =>
                supabase.from('questions').update({ is_killer }).eq('id', id)
            )

            const results = await Promise.all(updates)
            const error = results.find(r => r.error)?.error

            if (error) {
                alert("Error saving risk configuration: " + error.message)
            } else {
                setStagedKillers({})
                setHasUnsavedChanges(false)
                await refreshData()
                alert("Risk Configuration deployed globally!")
            }
        } catch (e: any) {
            alert("Unexpected error: " + e.message)
        } finally {
            setIsSaving(false)
        }
    }

    const totalWeight = domains.reduce((sum, d) => sum + (d.defaultWeight || 0), 0)
    const isWeightBalanced = Math.abs(totalWeight - 100) < 0.01 // Handle floating point math

    return (
        <div className="min-h-screen bg-white font-inter pb-20">
            {/* Header */}
            <header className="bg-si-navy border-b border-white/5 px-8 py-6 flex items-center justify-between sticky top-0 z-50 shadow-2xl">
                <div className="flex items-center gap-6">
                    <Link href="/admin" className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <Scale className="w-3 h-3 text-si-blue-primary" />
                            <span className="text-[10px] text-si-blue-primary font-black uppercase tracking-[0.3em]">Module: Content Processor</span>
                        </div>
                        <h1 className="text-xl font-black text-white font-outfit tracking-tight mt-1">Audit framework Editor</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {hasUnsavedChanges && (
                        <button
                            onClick={handleSaveRiskConfiguration}
                            disabled={isSaving}
                            className="px-6 py-3 bg-si-red text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-si-red/80 transition-all duration-500 shadow-xl shadow-si-red/20 flex items-center gap-2 animate-in fade-in slide-in-from-right-4"
                        >
                            <Save className="w-4 h-4" />
                            Save Risk Configuration
                        </button>
                    )}
                    {isSaving && (
                        <div className="flex items-center gap-3 py-2 px-4 bg-si-blue-primary/10 rounded-full border border-si-blue-primary/20 animate-pulse">
                            <div className="w-2 h-2 bg-si-blue-primary rounded-full" />
                            <span className="text-[10px] font-black text-si-blue-primary uppercase tracking-widest">Processing...</span>
                        </div>
                    )}
                    <button
                        onClick={handleResetAllKillers}
                        className="px-6 py-3 bg-white text-si-navy border border-slate-200 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-slate-50 transition-all duration-500 flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4 text-si-red/50" />
                        Reset Killers
                    </button>
                    <button className="px-6 py-3 bg-white text-si-navy text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-si-blue-primary hover:text-white transition-all duration-500 shadow-xl shadow-white/5">
                        <Plus className="w-4 h-4 inline-block mr-2 mt-[-2px]" />
                        Deploy New Domain
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-12">
                {!isWeightBalanced && (
                    <div className="mb-10 bg-si-red/10 border-2 border-si-red/20 rounded-3xl p-6 flex items-start gap-6 animate-in fade-in slide-in-from-top-4">
                        <div className="w-12 h-12 bg-si-red text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-si-red/20">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-si-red tracking-tight font-outfit">Critical Weight Imbalance</h3>
                            <p className="text-si-navy/70 mt-1 max-w-2xl">
                                The total mathematical weight of all domains must equal exactly 100% for the scoring engine to function correctly.
                                Currently, the sum is <span className="font-black text-si-navy">{totalWeight.toFixed(1)}%</span>.
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-12">
                    {domains.map((domain) => (
                        <motion.div
                            key={domain.id}
                            initial={false}
                            className={`bg-slate-50 rounded-[48px] border-2 transition-all duration-500 overflow-hidden ${expandedDomain === domain.id ? 'border-si-blue-primary shadow-2xl shadow-si-blue-primary/5' : 'border-slate-50 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50'}`}
                        >
                            {/* Domain Header / Weight Processor */}
                            <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-8 w-full md:w-auto">
                                    <div className="w-16 h-16 bg-si-navy text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-si-navy/20">
                                        <Layers className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="w-full font-black text-2xl text-si-navy bg-transparent border-none p-0 font-outfit italic tracking-tight break-words px-4 py-1">
                                            {domain.name}
                                        </h2>
                                        <div className="flex items-center gap-4 mt-2 px-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Reference ID:</span>
                                            <span className="text-[10px] font-bold text-si-navy font-mono opacity-50">{domain.id}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-12 bg-white px-8 py-5 rounded-[32px] border border-slate-100 shadow-sm w-full md:w-auto justify-between md:justify-start">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Scale className="w-3 h-3 text-si-blue-primary" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Static Weight</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                step="0.1"
                                                defaultValue={domain.defaultWeight}
                                                onBlur={(e) => handleUpdateDomain(domain.id, { default_weight: parseFloat(e.target.value) })}
                                                className="w-20 text-xl font-black text-si-blue-primary bg-slate-50 border-none focus:ring-2 focus:ring-si-blue-primary/20 rounded-lg px-2 py-1 text-center"
                                            />
                                            <span className="text-xs font-bold text-slate-300">%</span>
                                        </div>
                                    </div>

                                    <div className="h-10 w-[1px] bg-slate-100" />

                                    <div className="flex flex-col text-right">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Nodes</span>
                                        <span className="text-xl font-black text-si-navy font-outfit italic">{domain.questions.length}</span>
                                    </div>

                                    <button
                                        onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${expandedDomain === domain.id ? 'bg-si-navy text-white rotate-180' : 'bg-slate-50 text-slate-300 hover:text-si-navy hover:bg-slate-100'}`}
                                    >
                                        <ChevronDown className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Questions Area / Killer Controls */}
                            <AnimatePresence>
                                {expandedDomain === domain.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.5, ease: "circOut" }}
                                    >
                                        <div className="px-10 pb-10">
                                            <div className="bg-white rounded-[40px] border border-slate-100 p-8 space-y-6">
                                                <div className="flex items-center justify-between mb-8 px-4 border-l-4 border-si-navy pl-6">
                                                    <div>
                                                        <h5 className="font-black text-si-navy uppercase tracking-[0.2em] text-xs">Node Matrix</h5>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">Individual response logic and auto-decline triggers</p>
                                                    </div>
                                                    <button className="px-4 py-2 bg-slate-50 hover:bg-si-navy hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-100">
                                                        Add New Node
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    {domain.questions.map((q) => (
                                                        <div key={q.id} className="group p-6 rounded-[28px] border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center gap-8">
                                                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-300 border border-slate-100 shrink-0 group-hover:text-si-navy group-hover:border-si-navy/20 transition-colors">
                                                                {q.id.split('-')[1] || 'QD'}
                                                            </div>

                                                            <div className="flex-1">
                                                                <input
                                                                    type="text"
                                                                    defaultValue={q.text}
                                                                    onBlur={(e) => handleUpdateQuestion(q.id, { text: e.target.value })}
                                                                    className="w-full text-lg font-bold text-si-navy bg-transparent border-none focus:ring-0 p-0 hover:bg-white rounded-lg px-3 py-1 transition-all mb-2"
                                                                />
                                                                <div className="flex items-center gap-6 mt-1 px-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Info className="w-3 h-3 text-si-blue-primary" />
                                                                        <span className="text-[10px] font-black text-si-blue-primary uppercase tracking-[0.2em]">{q.type}</span>
                                                                    </div>
                                                                    <div className="w-[1px] h-3 bg-slate-200" />
                                                                    <span className="text-[10px] font-bold text-slate-400 font-mono opacity-50 uppercase">{q.id}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-8 bg-white px-6 py-4 rounded-2xl border border-slate-100 shrink-0">
                                                                <button
                                                                    onClick={() => handleKillerToggle(q.id, q.isKiller)}
                                                                    className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 transition-all ${(stagedKillers[q.id] !== undefined ? stagedKillers[q.id] : q.isKiller)
                                                                        ? 'bg-si-red border-si-red text-white shadow-lg shadow-si-red/20'
                                                                        : 'bg-slate-50 border-slate-50 text-slate-300 hover:border-si-red hover:text-si-red'
                                                                        } ${stagedKillers[q.id] !== undefined ? 'ring-2 ring-si-blue-primary/50 ring-offset-2' : ''}`}
                                                                >
                                                                    <Zap className={`w-4 h-4 ${(stagedKillers[q.id] !== undefined ? stagedKillers[q.id] : q.isKiller) ? 'animate-pulse' : ''}`} />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                                        {stagedKillers[q.id] !== undefined ? 'Staged Change' : 'Killer Control'}
                                                                    </span>
                                                                </button>

                                                                <div className="flex items-center gap-2">
                                                                    <button className="p-3 bg-slate-50 text-slate-300 hover:text-si-navy hover:bg-slate-100 rounded-xl transition-all">
                                                                        <Edit3 className="w-5 h-5" />
                                                                    </button>
                                                                    <button className="p-3 bg-slate-50 text-slate-300 hover:text-si-red hover:bg-red-50 rounded-xl transition-all">
                                                                        <Trash2 className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    )
}

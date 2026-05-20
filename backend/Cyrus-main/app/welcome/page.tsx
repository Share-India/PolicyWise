"use client"

import { 
    Shield, 
    ShieldCheck, 
    Play, 
    ArrowRight, 
    Settings as SettingsIcon, 
    Building2, 
    Users, 
    Calendar, 
    TrendingUp, 
    CheckCircle2, 
    MapPin, 
    AlertCircle,
    Loader2,
    Lock,
    Cloud,
    AlertTriangle,
    RotateCw,
    FileText,
    BarChart3,
    User,
    Save,
    LogOut,
    Globe,
    ExternalLink
} from "lucide-react"
import Link from "next/link"
import { getDossier, CompanyDossier } from "@/lib/company-data"
import { useUnderwriting } from "@/context/underwriting-context"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"
import { motion, AnimatePresence } from "framer-motion"
import { siteConfig } from "@/lib/site-config"

export default function WelcomePage() {
    const {
        completionStats,
        clientName,
        organizationWebsite,
        userProfile,
        isAdmin,
        updateProfile,
        signOut,
        handleReset,
        isLoading: contextLoading,
    } = useUnderwriting()

    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        organization_name: "",
        industry: "",
        username: ""
    })

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || "",
                organization_name: userProfile.organization_name || "",
                industry: userProfile.industry || "",
                username: userProfile.username || ""
            })
        }
    }, [userProfile])

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

    const [showDossierModal, setShowDossierModal] = useState(false)
    const [hasSeenModal, setHasSeenModal] = useState(false)
    const [dossier, setDossier] = useState<CompanyDossier | null>(null)
    const [isDossierLoading, setIsDossierLoading] = useState(false)
    const [dossierError, setDossierError] = useState<string | null>(null)

    const [hasAttemptedSynthesis, setHasAttemptedSynthesis] = useState(false)

    // Fetch dossier dynamically via Gemini + Google Search when profile is available
    useEffect(() => {
        const localConfirmedKey = `cyrus_dossier_confirmed_${userProfile?.id}`
        const isConfirmed = localStorage.getItem(localConfirmedKey) === "true"

        if (!contextLoading && userProfile && !hasSeenModal && !isConfirmed && !hasAttemptedSynthesis) {
            const orgName = userProfile.organization_name
            const websiteUrl = userProfile.organization_website || userProfile.website || ""
            const localCacheKey = `cyrus_cached_dossier_${userProfile.id}`

            if (!orgName || orgName.trim() === "") {
                setShowDossierModal(true);
                return; // Prevent API fetch but show modal to prompt for name
            }

            // Define what a "High-Fidelity" dossier looks like to avoid redundant triggers
            const isHighFidelity = (d: any) => {
                if (!d) return false;
                
                // CRITICAL: Reject any dossier containing "N/A" or "Unknown"
                const hasPlaceholders = JSON.stringify(d).toLowerCase().includes('"n/a"') || 
                                        JSON.stringify(d).toLowerCase().includes('"unknown"') ||
                                        d.founded?.includes("N/A") ||
                                        d.hq?.includes("N/A");
                if (hasPlaceholders) return false;

                // It must match the current organization name
                if (orgName && d.name && !d.name.toLowerCase().includes(orgName.toLowerCase()) && !orgName.toLowerCase().includes(d.name.toLowerCase().split(' ')[0])) {
                    return false;
                }
                
                // Deep Detail Requirements: Must have at least 3 revenue streams, 2 milestones, and cloud/compliance data
                const hasDeepDetail = 
                    Array.isArray(d.revenueStreams) && d.revenueStreams.length >= 2 &&
                    Array.isArray(d.cloudInfrastructure) && d.cloudInfrastructure.length >= 1 &&
                    Array.isArray(d.complianceFrameworks) && d.complianceFrameworks.length >= 1;

                return hasDeepDetail;
            }

            // 1. Check Database Profile for an existing dossier FIRST (Cloud Truth)
            if (isHighFidelity(userProfile.company_dossier)) {
                console.log("☁️ [Dossier]: Existing intelligence found in Cloud Profile. Presenting for review.");
                setDossier(userProfile.company_dossier)
                setShowDossierModal(true)
                setHasSeenModal(true) 
                // Sync to local cache for performance
                localStorage.setItem(localCacheKey, JSON.stringify(userProfile.company_dossier))
                return
            }

            // 2. Check LocalStorage Cache
            const cachedData = localStorage.getItem(localCacheKey)
            if (cachedData) {
                try {
                    const parsedCache = JSON.parse(cachedData)
                    if (isHighFidelity(parsedCache)) {
                        console.log("📦 [Dossier]: High-fidelity intelligence found in local cache.");
                        setDossier(parsedCache)
                        setShowDossierModal(true)
                        return
                    }
                    console.log("🔄 Cached dossier is generic or mismatched. Re-synthesizing...");
                } catch (e) {
                    console.error("Failed to parse cached dossier", e)
                }
            }

            // 3. No Confirmed/Cached Dossier → Call Gemini & Shodan API
            console.log("🚀 [Dossier]: Initializing First-Time Intelligence Synthesis...");
            setHasAttemptedSynthesis(true)
            setIsDossierLoading(true)
            setShowDossierModal(true)

            fetch("/api/generate-dossier", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    organizationName: orgName, 
                    websiteUrl,
                    userId: userProfile.id,
                    forceRefresh: true // Bypass DB cache for first-time synthesis
                })
            })
                .then(async res => {
                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || `Generation failed: ${res.statusText}`);
                    }
                    return res.json()
                })
                .then(async (data: CompanyDossier) => {
                    setDossier(data)
                    
                    // AUTO-SAVE: Persist immediately so it's not lost on refresh
                    if (userProfile?.id) {
                        console.log("💾 [Dossier]: Auto-persisting synthesized intelligence...");
                        await updateProfile({ 
                            company_dossier: data 
                        });
                        localStorage.setItem(localCacheKey, JSON.stringify(data))
                    }
                })
                .catch(err => {
                    console.error("[Dossier Fetch Error]", err)
                    setDossierError(err.message || "Intelligence synthesis failed. Please try again.")
                })
                .finally(() => setIsDossierLoading(false))
        }
    }, [contextLoading, userProfile, hasSeenModal])

    const handleConfirmDossier = async () => {
        if (dossier && userProfile?.id) {
            console.log("✅ [Dossier]: Confirmation received. Moving to assessment floor.");
            const localConfirmedKey = `cyrus_dossier_confirmed_${userProfile.id}`
            localStorage.setItem(localConfirmedKey, "true")
            
            await updateProfile({ 
                company_dossier: dossier 
            });
        }
        setShowDossierModal(false)
        setHasSeenModal(true)
    }



    return (
        <div className="min-h-screen bg-slate-50 font-inter text-slate-900 flex flex-col">
            <AnimatePresence>
                {showDossierModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-500/30 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
                        >
                            <div className="p-10 md:p-14">
                                {/* Loading State — Gemini synthesizing */}
                                {isDossierLoading && (
                                    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                                        <div className="relative w-20 h-20">
                                            <div className="absolute inset-0 rounded-full border-4 border-si-blue-primary/20 animate-pulse" />
                                            <div className="absolute inset-2 rounded-full border-4 border-t-si-blue-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Shield className="w-7 h-7 text-si-blue-primary" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-si-navy font-outfit tracking-tight">Synthesizing Intelligence</h3>
                                            <p className="text-sm text-slate-500 font-medium mt-2 max-w-sm mx-auto">CYRUS.PRO is searching the web and performing OSINT scans to analyze your organization&apos;s digital risk profile. This may take 15–30 seconds.</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-si-blue-primary bg-si-blue-primary/10 px-4 py-2 rounded-full border border-si-blue-primary/20">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Powered by Gemini + Google Search + Shodan
                                        </div>
                                    </div>
                                )}

                                {/* Error State or Missing Info */}
                                 {!isDossierLoading && (dossierError || (!userProfile?.organization_name)) && (
                                     <div className="flex flex-col items-center justify-center py-24 gap-6 text-center max-w-sm mx-auto">
                                         <div className="w-20 h-20 bg-amber-50 rounded-[32px] flex items-center justify-center border border-amber-100 shadow-sm">
                                             {!userProfile?.organization_name ? (
                                                <Building2 className="w-10 h-10 text-amber-500" />
                                             ) : (
                                                <AlertCircle className="w-10 h-10 text-rose-500" />
                                             )}
                                         </div>
                                         <div>
                                             <h3 className="text-2xl font-black text-si-navy font-outfit tracking-tight">
                                                 {!userProfile?.organization_name ? "Identity Verification Required" : "Intelligence Gap Detected"}
                                             </h3>
                                             <p className="text-sm text-slate-500 mt-2 font-medium">
                                                 {!userProfile?.organization_name 
                                                    ? "We need your Organization Name to perform technical OSINT reconnaissance and build your risk dossier." 
                                                    : "The automated OSINT scan could not reach a high-fidelity threshold. Please verify your organization name and retry."}
                                             </p>
                                         </div>

                                         {!userProfile?.organization_name ? (
                                             <div className="w-full space-y-3">
                                                 <Link href="/settings" className="flex items-center justify-center gap-2 w-full py-4 bg-si-navy text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-si-blue-primary transition-all shadow-lg shadow-si-navy/20">
                                                     Complete Profile Setup
                                                     <ArrowRight className="w-3 h-3" />
                                                 </Link>
                                             </div>
                                         ) : (
                                             <div className="w-full space-y-3">
                                                 <button 
                                                     onClick={() => {
                                                         setDossierError(null);
                                                         setHasAttemptedSynthesis(false);
                                                         // Clear local confirmation to force re-trigger
                                                         const localConfirmedKey = `cyrus_dossier_confirmed_${userProfile?.id}`;
                                                         localStorage.removeItem(localConfirmedKey);
                                                         window.location.reload();
                                                     }} 
                                                     className="flex items-center justify-center gap-2 w-full py-4 bg-si-blue-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-si-navy transition-all shadow-lg shadow-si-blue-primary/20"
                                                 >
                                                     Retry High-Fidelity Synthesis
                                                     <RotateCw className="w-3 h-3" />
                                                 </button>
                                                 <button onClick={handleConfirmDossier} className="w-full py-3 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">
                                                     Proceed with Baseline Profile
                                                 </button>
                                             </div>
                                         )}
                                     </div>
                                 )}

                                {/* Dossier Content — only shown once loaded */}
                                {!isDossierLoading && !dossierError && userProfile?.organization_name && (<>
                                {/* Modal Header */}
                                <div className="flex items-start gap-4 mb-8">
                                    <div className="w-14 h-14 bg-si-blue-primary/10 rounded-2xl flex items-center justify-center text-si-blue-primary flex-shrink-0 mt-1">
                                        <Building2 className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black font-outfit text-si-navy tracking-tight leading-tight">Organization Intelligence Dossier</h2>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Comprehensive profile compiled from verified sources. Please confirm before proceeding to your cyber risk assessment.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">

                                    {/* 1. ENTITY IDENTITY & FINANCIAL SCALE */}
                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 relative overflow-hidden shadow-sm">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-si-blue-primary/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                                        
                                        <div className="relative z-10">
                                            <span className="text-[10px] font-black text-si-blue-primary uppercase tracking-widest block mb-4">① Verified Entity Profile</span>
                                            <h3 className="text-3xl md:text-4xl font-black text-si-navy font-outfit mb-6 tracking-tight leading-tight">{dossier?.name || userProfile?.organization_name}</h3>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                                <div className="bg-slate-50/80 border border-slate-200/50 rounded-2xl p-5 shadow-sm hover:border-si-blue-primary/30 transition-colors">
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-si-blue-primary" /> Established</p>
                                                    <p className="text-xl font-black text-si-navy font-outfit">{dossier?.founded}</p>
                                                </div>
                                                <div className="bg-slate-50/80 border border-slate-200/50 rounded-2xl p-5 shadow-sm hover:border-si-blue-primary/30 transition-colors">
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-si-blue-primary" /> Workforce</p>
                                                    <p className="text-xl font-black text-si-navy font-outfit">{dossier?.employees}</p>
                                                </div>
                                                <div className="bg-si-navy border border-si-navy rounded-2xl p-5 shadow-xl shadow-si-navy/10 col-span-2">
                                                    <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-si-blue-primary" /> Annual Revenue Scale</p>
                                                    <p className="text-xl font-black text-white font-outfit">{dossier?.annualRevenue}</p>
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{dossier?.description}</p>
                                        </div>
                                    </div>

                                    {/* 2. LEADERSHIP & CONTROL MAP */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 bg-si-blue-primary/10 rounded-lg flex items-center justify-center text-si-blue-primary"><Shield className="w-4 h-4" /></div>
                                                <span className="text-[10px] font-black text-si-navy uppercase tracking-widest">Leadership & Control</span>
                                            </div>
                                            <p className="text-[13px] font-bold text-slate-800 leading-relaxed border-l-2 border-si-blue-primary pl-4">{dossier?.leadership}</p>
                                        </div>
                                        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div>
                                                <span className="text-[10px] font-black text-si-navy uppercase tracking-widest">Track Record & Legacy</span>
                                            </div>
                                            <p className="text-[13px] text-slate-600 font-medium leading-relaxed italic">{dossier?.legacy}</p>
                                        </div>
                                    </div>

                                    {/* 3. BUSINESS MODEL */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">③ Business Model & Operational Scale</span>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{dossier?.businessModel || "Critical operator within the supply chain network."}</p>
                                    </div>

                                    {/* 4. REVENUE STREAMS INFOGRAPHIC */}
                                    {Array.isArray(dossier?.revenueStreams) && dossier.revenueStreams.length > 0 && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">④ Revenue Stream Composition</span>
                                            <div className="space-y-4">
                                                {dossier.revenueStreams.map((stream: {label: string; description: string; percentage?: number}, idx: number) => (
                                                    <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden group">
                                                        {stream.percentage && (
                                                            <div className="absolute top-0 right-0 h-full w-full bg-slate-50 origin-left scale-x-0 transition-transform duration-1000 ease-out group-hover:scale-x-100" />
                                                        )}
                                                        <div className="relative z-10">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <p className="text-sm font-black text-si-navy uppercase tracking-wide">{stream.label}</p>
                                                                {stream.percentage && (
                                                                    <span className="text-xs font-black text-si-blue-primary bg-si-blue-primary/10 px-2 py-1 rounded-lg">
                                                                        {stream.percentage}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {stream.percentage && (
                                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                                                                    <motion.div 
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${stream.percentage}%` }}
                                                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                                                        className="h-full bg-si-blue-primary rounded-full"
                                                                    />
                                                                </div>
                                                            )}
                                                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{stream.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 5. INDUSTRIES SERVED + NOTABLE CLIENTS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Array.isArray(dossier?.industriesServed) && dossier.industriesServed.length > 0 && (
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">⑤ Industries Served</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {dossier.industriesServed.map((ind: string, idx: number) => (
                                                        <span key={idx} className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">{ind}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {Array.isArray(dossier?.notableClients) && dossier.notableClients.length > 0 && (
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Notable Clients</span>
                                                <div className="space-y-2">
                                                    {dossier.notableClients.map((client: string, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-si-blue-primary flex-shrink-0" />
                                                            <span className="text-xs font-semibold text-slate-700">{client}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 5B. SUBSIDIARIES & COMPETITORS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Array.isArray(dossier?.subsidiaries) && dossier.subsidiaries.length > 0 && (
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Strategic Subsidiaries</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {dossier.subsidiaries.map((sub: string, idx: number) => (
                                                        <span key={idx} className="text-[10px] font-bold text-si-navy bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-sm">{sub}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {Array.isArray(dossier?.keyCompetitors) && dossier.keyCompetitors.length > 0 && (
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Primary Market Competitors</span>
                                                <div className="space-y-2">
                                                    {dossier.keyCompetitors.map((comp: string, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                                                            <span className="text-xs font-semibold text-slate-600">{comp}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 6. OPERATIONAL REACH GEOSPATIAL MAP */}
                                    {Array.isArray(dossier?.operationalReach) && dossier.operationalReach.length > 0 && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Headquarters</p>
                                                        <p className="text-sm font-bold text-si-navy">{dossier.hq}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Global Presence</p>
                                                        <p className="text-xs font-bold text-si-navy">{dossier.operationalReach.length} Regions</p>
                                                    </div>
                                                </div>
                                                {dossier.shodanIntelligence?.openPorts && dossier.shodanIntelligence.openPorts.length > 0 && (
                                                    <div className="mb-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {dossier.shodanIntelligence.openPorts.slice(0, 10).map((p, idx) => (
                                                                <span 
                                                                    key={idx} 
                                                                    className={`px-2 py-1 text-[10px] rounded border font-mono font-bold ${
                                                                        p.risk === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                                                                        p.risk === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                                                                        'bg-slate-100 text-slate-600 border-slate-200'
                                                                    }`}
                                                                >
                                                                    Port {p.port}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {dossier.shodanIntelligence?.techStack && dossier.shodanIntelligence.techStack.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Passive Stack Identification</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {dossier.shodanIntelligence.techStack.slice(0, 8).map((tech, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-white text-slate-600 text-[10px] rounded border border-slate-200 font-bold">{tech}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                    )}

                                    {/* 7. KEY MILESTONES */}
                                    {Array.isArray(dossier?.keyMilestones) && dossier.keyMilestones.length > 0 && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">⑦ Key Corporate Milestones</span>
                                            <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
                                                {dossier.keyMilestones.map((m: {year: string; event: string}, idx: number) => (
                                                    <div key={idx} className="relative">
                                                        <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-si-blue-primary border-2 border-white shadow" />
                                                        <span className="text-[10px] font-black text-si-blue-primary uppercase tracking-widest">{m.year}</span>
                                                        <p className="text-xs text-slate-700 font-medium leading-relaxed mt-0.5">{m.event}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 8. PRODUCT PORTFOLIO */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">⑧ Core Product & Service Portfolio</span>
                                        <div className="flex flex-wrap gap-2">
                                            {(Array.isArray(dossier?.portfolio) ? dossier.portfolio : ["Standardized Infrastructure", "Secure Network Ops"]).map((item: string, idx: number) => (
                                                <div key={idx} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 shadow-sm flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-si-blue-primary flex-shrink-0" />
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 9. DIGITAL ASSETS & CLOUD INFRASTRUCTURE */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Array.isArray(dossier?.digitalAssets) && dossier.digitalAssets.length > 0 && (
                                            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-3">⑨ Digital Assets at Risk</span>
                                                <div className="space-y-2">
                                                    {dossier.digitalAssets.map((asset: string, idx: number) => (
                                                        <div key={idx} className="flex items-start gap-2">
                                                            <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                                                            <span className="text-xs text-slate-700 font-medium leading-relaxed">{asset}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {Array.isArray(dossier?.cloudInfrastructure) && dossier.cloudInfrastructure.length > 0 && (
                                            <div className="bg-si-navy p-6 rounded-2xl border border-white/10 shadow-xl">
                                                <span className="text-[10px] font-black text-si-blue-primary uppercase tracking-widest block mb-3 flex items-center gap-2"><Cloud className="w-3 h-3" /> Cloud Infrastructure</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {dossier.cloudInfrastructure.map((cloud: string, idx: number) => (
                                                        <span key={idx} className="text-[10px] font-black text-white bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg">{cloud}</span>
                                                    ))}
                                                </div>
                                                {Array.isArray(dossier?.complianceFrameworks) && dossier.complianceFrameworks.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-white/5">
                                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">Compliance Attestations</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {dossier.complianceFrameworks.map((frame: string, idx: number) => (
                                                                <span key={idx} className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">{frame}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* 9B. RECENT SECURITY INCIDENTS */}
                                    {Array.isArray(dossier?.recentSecurityIncidents) && dossier.recentSecurityIncidents.length > 0 && (
                                        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white animate-pulse">
                                                    <AlertTriangle className="w-4 h-4" />
                                                </div>
                                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Adversarial Activity Log</span>
                                            </div>
                                            <div className="space-y-4">
                                                {dossier.recentSecurityIncidents.map((incident: {year: string; title: string; impact: string}, idx: number) => (
                                                    <div key={idx} className="bg-white/60 rounded-xl p-4 border border-rose-100">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-xs font-black text-rose-700 uppercase">{incident.title}</p>
                                                            <span className="text-[10px] font-black text-rose-400">{incident.year}</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{incident.impact}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 10. SUPPLY CHAIN EXPOSURE */}
                                    {dossier?.supplyChainExposure && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">⑩ Supply Chain & Vendor Exposure</span>
                                            <p className="text-sm text-slate-700 leading-relaxed">{dossier.supplyChainExposure}</p>
                                        </div>
                                    )}

                                    {/* 11. REGULATORY ENVIRONMENT */}
                                    {dossier?.regulatoryEnvironment && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">⑪ Regulatory & Compliance Environment</span>
                                            <p className="text-sm text-slate-700 leading-relaxed">{dossier.regulatoryEnvironment}</p>
                                        </div>
                                    )}

                                    {/* 12. WHY CYBER INSURANCE */}
                                    {dossier?.cyberThreatNarrative && (
                                        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200">
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">⑫ Why Cyber Insurance is Critical</span>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">{dossier.cyberThreatNarrative}</p>
                                        </div>
                                    )}

                                    {/* 13. CYBER RISK EXPOSURE BARS */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">⑬ Quantified Cyber Risk Exposure</span>
                                        <p className="text-xs text-slate-400 mb-5">Sector-calibrated threat intelligence scores. Red ≥ 70% (Critical) · Amber ≥ 55% (High) · Blue (Moderate).</p>
                                        <div className="space-y-5">
                                            {(Array.isArray(dossier?.cyberStats) ? 
                                                dossier.cyberStats
                                                    // Filter out entries where Gemini returned a raw monetary/count value instead of a risk %
                                                    .filter((stat: { label: string; value: number; reasoning: string }) => 
                                                        typeof stat.value === 'number' && stat.value >= 0 && stat.value <= 100
                                                    )
                                                : [
                                                { label: "Business Interruption Risk", value: 85, reasoning: "High operational dependency on synchronized digital infrastructure. Any downtime triggers immediate downstream loss." },
                                                { label: "Supply Chain Vulnerability", value: 72, reasoning: "Risk propagated from third-party vendor interfaces and digital procurement dependencies." },
                                                { label: "Data Exfiltration Threat", value: 64, reasoning: "Inherent risk to organizational IP and confidential project records." }
                                            ]).map((stat: { label: string; value: number; reasoning: string }, idx: number) => {
                                                // Clamp value to 0-100 as a safety net
                                                const safeValue = Math.min(100, Math.max(0, stat.value))
                                                const color = safeValue >= 70 ? '#f43f5e' : safeValue >= 55 ? '#f59e0b' : '#3b82f6'
                                                const barGradient = safeValue >= 70
                                                    ? 'linear-gradient(to right, #f87171, #f43f5e)'
                                                    : safeValue >= 55
                                                    ? 'linear-gradient(to right, #fbbf24, #f97316)'
                                                    : 'linear-gradient(to right, #3b82f6, #60a5fa)'
                                                const severity = safeValue >= 70 ? 'CRITICAL' : safeValue >= 55 ? 'HIGH' : 'MODERATE'
                                                return (
                                                    <div key={idx}>
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="text-sm text-slate-700 font-semibold">{stat.label}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}20` }}>{severity}</span>
                                                                <span className="font-black text-base" style={{ color }}>{safeValue}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${safeValue}%` }}
                                                                transition={{ duration: 1.4, delay: 0.3 + idx * 0.15, ease: "easeOut" }}
                                                                style={{ background: barGradient }}
                                                                className="h-full rounded-full"
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-slate-700 font-medium italic mt-2 leading-relaxed border-l-2 border-si-blue-primary/30 pl-2">
                                                            {stat.reasoning}
                                                        </p>
                                                    </div>
                                                )
                                            })}

                                        </div>
                                    </div>

                                </div>

                                {/* Footer Actions */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 mt-8 border-t border-slate-100">
                                    <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                                        By confirming, you acknowledge that this profile accurately reflects your organization's operational scope for the purpose of cyber risk evaluation.
                                    </p>
                                    <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
                                        <Link href="/settings" className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                                              onClick={() => setShowDossierModal(false)}>
                                            Update Details
                                        </Link>
                                        <button
                                            onClick={handleConfirmDossier}
                                            className="w-full sm:w-auto px-8 py-4 bg-si-blue-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-si-blue-primary/20 flex items-center justify-center gap-2 hover:bg-si-navy transition-all active:scale-95"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            Confirm Details
                                        </button>
                                    </div>
                                </div>
                                </>)}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <img src="/share-india-new.png" alt={siteConfig.company} className="h-9 w-auto" />
                    <div className="h-8 w-[1px] bg-slate-200" />
                    <div>
                        <h1 className="text-lg font-black text-si-navy font-outfit tracking-tight leading-none">
                            {siteConfig.name}<span className="text-si-blue-primary">.</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Elite Audit</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Authorized Access</p>
                    </div>
                    <Link
                        href="/settings"
                        className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-si-navy group"
                        title="Profile Settings"
                    >
                        <SettingsIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    </Link>
                    <button
                        onClick={signOut}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-si-red hover:border-si-red/30 transition-all active:scale-95"
                    >
                        Exit Session
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto w-full p-8 md:p-16">
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center min-h-[70vh] py-16">
                    {/* Left Column: Core CTA */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-si-blue-primary/10 rounded-full text-si-blue-primary font-bold text-xs uppercase tracking-widest mb-8">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Audit Framework v2.0 Live</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black text-si-navy font-outfit tracking-tight mb-8 leading-tight">
                                Comprehensive <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-si-blue-primary to-si-blue-secondary">Cyber Risk Profiling</span>
                            </h1>

                            <p className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed mb-10">
                                This audit assesses your organization's cybersecurity posture across 19 critical infrastructure domains. The output is a definitive risk tier rating and risk profiling evaluation.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                <Link href="/assessment">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="group px-8 py-5 bg-si-navy text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-si-navy/20 flex items-center gap-4 hover:bg-si-blue-primary transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                            <Play className="w-5 h-5 fill-current" />
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-[10px] text-white/60 mb-1">
                                                {completionStats.percentage > 0 ? "RESUME SESSION" : "INITIALIZE AUDIT"}
                                            </span>
                                            <span className="text-lg">
                                                {completionStats.percentage > 0 ? "Continue Assessment" : "Begin Assessment"}
                                            </span>
                                        </div>
                                        <ArrowRight className="w-5 h-5 ml-4 group-hover:translate-x-1 transition-transform" />
                                    </motion.button>
                                </Link>

                                {completionStats.percentage > 0 && (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                            <div className="relative w-12 h-12">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                    <path
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="#E2E8F0"
                                                        strokeWidth="3"
                                                    />
                                                    <path
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="#3B82F6"
                                                        strokeWidth="3"
                                                        strokeDasharray={`${completionStats.percentage}, 100`}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-si-navy">
                                                    {completionStats.percentage}%
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-si-navy uppercase">Overall Progress</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{completionStats.answered} / {completionStats.total} Answered</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                if (window.confirm("This will clear your current progress and start a fresh assessment. Continue?")) {
                                                    await handleReset();
                                                    window.location.href = "/assessment";
                                                }
                                            }}
                                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-si-red transition-colors text-left pl-4"
                                        >
                                            Discard & Start New Assessment
                                        </button>
                                    </div>
                                )}
                            </div>

                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="mt-16 pt-12 border-t border-slate-100"
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-1 bg-si-blue-primary rounded-full" />
                                    <h3 className="text-sm font-black text-si-navy uppercase tracking-[0.2em]">The Strategic Utility of Risk Transfer</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        {
                                            title: "Balance Sheet Protection",
                                            desc: "Insulate your operational capital from catastrophic ransomware demands and business interruption losses that can freeze cash flows.",
                                            icon: Lock,
                                            color: "bg-blue-50 text-blue-600"
                                        },
                                        {
                                            title: "Contractual Credibility",
                                            desc: "Meet mandatory cybersecurity coverage required by Fortune 500 MNCs and government agencies to secure premium B2B contracts.",
                                            icon: Building2,
                                            color: "bg-indigo-50 text-indigo-600"
                                        },
                                        {
                                            title: "Crisis Response Mastery",
                                            desc: "Gain immediate access to elite digital forensic teams, legal counsel, and PR stabilization the moment a breach occurs.",
                                            icon: AlertCircle,
                                            color: "bg-rose-50 text-rose-600"
                                        },
                                        {
                                            title: "Total Risk Resilience",
                                            desc: "Combine technical defenses with financial risk transfer to create a multi-layered security posture that protects both data and equity.",
                                            icon: ShieldCheck,
                                            color: "bg-emerald-50 text-emerald-600"
                                        }
                                    ].map((item, idx) => (
                                        <div key={idx} className="group p-6 bg-white rounded-[32px] border border-slate-100 hover:border-si-blue-primary/30 hover:shadow-2xl hover:shadow-si-blue-primary/5 transition-all duration-500">
                                            <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
                                                <item.icon className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-lg font-black text-si-navy mb-2">{item.title}</h4>
                                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                                {item.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Right Column: Client Context Docket */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="bg-si-navy text-white rounded-[48px] p-10 border border-white/5 shadow-2xl shadow-si-navy/40 relative overflow-hidden group"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-si-blue-primary/20 rounded-xl flex items-center justify-center text-si-blue-primary border border-si-blue-primary/30">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-si-blue-primary">Verified Node</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">System Status</span>
                                        <span className="text-[10px] text-emerald-400 font-black uppercase flex items-center gap-2 justify-end">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                            Synchronized
                                        </span>
                                    </div>
                                </div>

                                {(() => {
                                    // PRIORITY 1: Dynamic Dossier from API (Current Session)
                                    // PRIORITY 2: Persisted Dossier from Profile (Database)
                                    // PRIORITY 3: Static Template (Hardcoded legacy data)
                                    const activeDossier = dossier || userProfile?.company_dossier || getDossier(userProfile?.organization_name);

                                    // LOADING STATE: Show high-fidelity skeleton while AI is synthesizing
                                    if (isDossierLoading) {
                                        return (
                                            <div className="space-y-8 animate-pulse">
                                                <div className="flex items-center gap-5 opacity-50">
                                                    <div className="w-14 h-14 bg-white/10 rounded-2xl" />
                                                    <div className="space-y-2">
                                                        <div className="h-6 w-48 bg-white/10 rounded" />
                                                        <div className="h-3 w-32 bg-white/10 rounded" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {[1, 2].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl border border-white/5" />)}
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="h-3 w-24 bg-white/10 rounded" />
                                                    <div className="flex gap-2">
                                                        {[1, 2, 3].map(i => <div key={i} className="h-8 w-20 bg-white/5 rounded-lg" />)}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="h-3 w-32 bg-white/10 rounded" />
                                                    <div className="h-20 bg-white/5 rounded-2xl" />
                                                </div>
                                                <p className="text-[10px] text-si-blue-primary font-black uppercase tracking-widest text-center animate-bounce">
                                                    Synthesizing OSINT Intelligence...
                                                </p>
                                            </div>
                                        );
                                    }

                                    if (activeDossier) {
                                        const isGeneric = activeDossier.leadership === "Authorized Signatory" || !activeDossier.revenueStreams;

                                        return (
                                            <div className="space-y-8">
                                                <div>
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-4">Organizational Legacy</span>
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-si-blue-primary group-hover:bg-si-blue-primary group-hover:text-white transition-all duration-500 flex-shrink-0">
                                                            <Building2 className="w-7 h-7" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h2 className="text-xl font-black font-outfit tracking-tight mb-0.5 italic text-white leading-tight underline decoration-si-blue-primary/30 truncate">
                                                                {activeDossier.name}
                                                            </h2>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-si-blue-primary" />
                                                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter truncate">
                                                                    {activeDossier.founded ? `Est. ${activeDossier.founded}` : 'Established Node'} • {activeDossier.hq || 'Global Reach'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-sm">
                                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block mb-1.5">Leadership</span>
                                                        <p className="text-[10px] font-bold text-white/70 truncate">{activeDossier.leadership || 'Verified Stakeholders'}</p>
                                                        <p className="text-[8px] text-white/40 mt-0.5 uppercase">Corporate Control</p>
                                                    </div>
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-sm">
                                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block mb-1.5">Market Status</span>
                                                        <p className="text-[10px] font-bold text-white/70 truncate">{activeDossier.annualRevenue || activeDossier.employees || 'Active Scale'}</p>
                                                        <p className="text-[8px] text-white/40 mt-0.5 uppercase">Operational Magnitude</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-3">Core Portfolio</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(activeDossier.portfolio && activeDossier.portfolio.length > 0 ? activeDossier.portfolio.slice(0, 4) : ["Standardized Infrastructure", "Secure Network Ops"]).map((item: string, idx: number) => (
                                                            <div key={idx} className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-white/60 tracking-tight whitespace-nowrap hover:bg-si-blue-primary/10 hover:border-si-blue-primary/30 transition-colors">
                                                                {item}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-3">Business Model</span>
                                                    <p className="text-[10px] font-medium text-white/50 leading-relaxed italic line-clamp-3">
                                                        {activeDossier.businessModel || "Critical operator within the supply chain network managing interconnected vendor operations."}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-4">Inherent Cyber Risk Factors</span>
                                                    <div className="space-y-4">
                                                        {(activeDossier.cyberStats || [
                                                            { label: "Business Interruption Risk", value: 85, reasoning: "Operational dependency on uptime." },
                                                            { label: "Supply Chain Vulnerability", value: 72, reasoning: "Exposure to vendor breaches." },
                                                            { label: "Data Exfiltration Threat", value: 64, reasoning: "Asset security risk." }
                                                        ]).map((stat: { label: string, value: number, reasoning: string }, idx: number) => (
                                                            <div key={idx} className="space-y-1">
                                                                <div className="flex justify-between text-[9px] items-center mb-0.5">
                                                                    <span className="text-white/50 font-bold uppercase tracking-tighter">{stat.label}</span>
                                                                    <span className={`${stat.value > 70 ? 'text-rose-500' : 'text-si-blue-primary'} font-black uppercase text-[8px]`}>{stat.value}% RISK</span>
                                                                </div>
                                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                                    <motion.div 
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${stat.value}%` }}
                                                                        transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                                                                        className={`h-full bg-gradient-to-r ${stat.value > 70 ? 'from-rose-500 to-rose-600' : 'from-si-blue-primary to-si-blue-secondary'} rounded-full`}
                                                                    />
                                                                </div>
                                                                <p className="text-[7px] text-white italic leading-[1.3] mt-1.5 pb-1">{stat.reasoning}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-si-blue-primary/10 rounded-lg flex items-center justify-center text-si-blue-primary border border-si-blue-primary/20">
                                                            <Globe className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[9px] font-medium text-white/40 leading-tight italic max-w-[200px]">
                                                                {isGeneric ? "Generic profile active. Enhancing..." : "Verified organizational profile active."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {((activeDossier.website && !activeDossier.website.toLowerCase().includes("n/a")) || userProfile?.organization_website) && (
                                                        <a
                                                            href={(activeDossier.website && !activeDossier.website.toLowerCase().includes("n/a") ? activeDossier.website : userProfile?.organization_website) || "#"}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2.5 bg-white/5 hover:bg-si-blue-primary/20 rounded-xl border border-white/5 transition-colors group/link"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover/link:text-si-blue-primary transition-colors" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // ABSOLUTE FALLBACK (Should rarely happen now)
                                    return (
                                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                                                <Building2 className="w-8 h-8" />
                                            </div>
                                            <p className="text-xs text-white/40 font-medium">Initializing Organizational Synthesis...</p>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-si-blue-primary/5 rounded-full blur-[100px] -mr-40 -mt-20 pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-si-blue-primary/10 rounded-full blur-[80px] opacity-20 pointer-events-none" />
                        </motion.div>
                    </div>
                </section>


                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-32 border-t border-slate-200 pt-16"
                >
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-2">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="font-outfit font-bold text-lg text-si-navy">Industry Standard</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Aligned with global cybersecurity frameworks (NIST, ISO 27001) for accurate risk benchmarking.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-2">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h3 className="font-outfit font-bold text-lg text-si-navy">Secure & Confidential</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Your assessment data is processed locally and formatted for direct underwriting submission.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-2">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h3 className="font-outfit font-bold text-lg text-si-navy">Instant Analytics</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Get immediate feedback on risk drivers, control gaps, and risk profiling results.
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}

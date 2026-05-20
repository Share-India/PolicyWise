"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import {
    DOMAINS,
    calculateScore,
    INDUSTRY_PROFILES,
    getIndustryWeights,
    MODEL_VERSION,
    type Domain,
    type ScoringResult,
    type IndustryProfile,
} from "@/lib/scoring-engine"
import { createClient } from "@/lib/supabase/client"

interface UnderwritingContextType {
    // State
    userRole: string | null
    isAdmin: boolean
    domains: Domain[]
    selectedIndustry: string
    clientName: string
    organizationWebsite: string
    manualOverrideEnabled: boolean
    result: ScoringResult
    completionStats: { total: number; answered: number; percentage: number }
    currentStep: number
    isLoading: boolean
    isIndustryLocked: boolean
    userProfile: any | null
    currentDomainIndex: number
    currentQuestionIndex: number
    hasDraft: boolean
    lastSavedTimestamp: string | null
    isSaving: boolean

    // Actions
    setDomains: React.Dispatch<React.SetStateAction<Domain[]>>
    setSelectedIndustry: (industryId: string) => void
    setClientName: (name: string) => void
    setManualOverrideEnabled: (enabled: boolean) => void
    handleDomainWeightChange: (domainId: string, newWeight: number) => void
    handleQuestionChange: (domainId: string, questionId: string, response: number) => void
    handleKillerToggle: (domainId: string, questionId: string, isKiller: boolean) => void
    handleReset: () => void
    saveDraft: () => Promise<{ success: boolean; error?: string }>
    autoSaveDraft: () => Promise<void>
    submitAssessment: () => Promise<{ success: boolean; assessmentId?: string; error?: string }>
    refreshData: () => Promise<Domain[] | null | void>
    updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>
    signOut: () => Promise<void>
    setCurrentDomainIndex: (index: number) => void
    setCurrentQuestionIndex: (index: number) => void
    isMfaVerified: boolean
    setMfaVerified: (verified: boolean) => void
}

// Helper to normalize industry ID (handles old typos and name storage)
const normalizeIndustryId = (input: string | null | undefined): string => {
    if (!input) return ""

    // Check if it's already a valid current ID
    const directMatch = INDUSTRY_PROFILES.find(p => p.id === input)
    if (directMatch) return directMatch.id

    // Map old typo IDs to new ones
    const legacyMap: Record<string, string> = {
        "it_and_tehnology_services": "it_and_technology_services",
        "logistics_and_transporation": "logistics_and_transportation"
    }
    if (legacyMap[input]) return legacyMap[input]

    // Check if it's the human-readable name
    const nameMatch = INDUSTRY_PROFILES.find(p => p.name === input)
    if (nameMatch) return nameMatch.id

    return input
}

const UnderwritingContext = createContext<UnderwritingContextType | undefined>(undefined)

export function UnderwritingProvider({ children }: { children: React.ReactNode }) {
    const [userRole, setUserRole] = useState<string | null>(null)
    const isAdmin = useMemo(() => userRole === 'admin', [userRole])
    const [domains, setDomains] = useState<Domain[]>([])
    const [manualOverrideEnabled, setManualOverrideEnabled] = useState(false)
    const [selectedIndustry, setSelectedIndustry] = useState<string>("")
    const [clientName, setClientName] = useState<string>("")
    const [organizationWebsite, setOrganizationWebsite] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [isIndustryLocked, setIsIndustryLocked] = useState(false)
    const [userProfile, setUserProfile] = useState<any | null>(null)
    const [currentDomainIndex, setCurrentDomainIndex] = useState(0)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [hasDraft, setHasDraft] = useState(false)
    const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isMfaVerified, setIsMfaVerified] = useState(false)

    const fetchQuestionnaire = useCallback(async (retryCount = 0): Promise<Domain[] | null> => {
        const supabase = createClient()

        try {
            console.log(`📡 Fetching questionnaire (Attempt ${retryCount + 1})...`)
            
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Database timeout after 12s (Attempt ${retryCount + 1})`)), 12000)
            )

            const fetchPromise = Promise.all([
                supabase.from('domains').select('*').order('display_order', { ascending: true }),
                supabase.from('questions').select('*')
            ])

            const [domainsRes, questionsRes] = await Promise.race([
                fetchPromise,
                timeoutPromise
            ]) as any

            if (domainsRes.error || questionsRes.error) {
                throw new Error(domainsRes.error?.message || questionsRes.error?.message || "DB Response Error")
            }

            const rawDomains = domainsRes.data || []
            const rawQuestions = questionsRes.data || []

            const stitchedDomains: Domain[] = rawDomains.map((d: any) => ({
                id: d.id,
                name: d.name,
                defaultWeight: Number(d.default_weight),
                activeWeight: Number(d.default_weight),
                explanation: d.explanation,
                questions: rawQuestions
                    .filter((q: any) => q.domain_id === d.id)
                    .map((q: any) => ({
                        id: q.id,
                        domain: d.name,
                        text: q.text,
                        type: q.type,
                        options: q.options,
                        response: -1,
                        isKiller: q.is_killer
                    }))
                    .sort((a: any, b: any) => a.id.localeCompare(b.id))
            }))

            setDomains(stitchedDomains)
            console.log("✅ Questionnaire fetched and stitched successfully")
            return stitchedDomains
        } catch (error: any) {
            console.error(`❌ Fetch attempt ${retryCount + 1} failed:`, error.message)

            if (retryCount < 1) {
                console.log("🔄 Retrying fetch in 2 seconds...")
                await new Promise(resolve => setTimeout(resolve, 2000))
                return fetchQuestionnaire(retryCount + 1)
            }

            console.warn("⚠️ Both fetch attempts failed. Falling back to local/static data.")
            const fallback = JSON.parse(JSON.stringify(DOMAINS))
            setDomains(fallback)
            return fallback
        }
    }, [])

    // Auth and Data Loading
    useEffect(() => {
        const init = async () => {
            setIsLoading(true)
            const supabase = createClient()

            // 1. Parallelize initial fetching (Session, Questionnaire)
            const [sessionRes, domainsData] = await Promise.all([
                supabase.auth.getSession(),
                fetchQuestionnaire()
            ])

            let finalDomains: Domain[] = domainsData || JSON.parse(JSON.stringify(DOMAINS))
            const session = sessionRes.data.session
            console.log("🔍 Session Check:", session ? `Active: ${session.user.id}` : "No Session")

            let cloudDraftData: any = null
            let profileIndustry: string | null = null

            // 2. Conditional fetching for User-specific data
            if (session?.user) {
                // Fetch Profile and draft in parallel if possible (though profile contains draft)
                // 2. Fetch Profile Role & Draft
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()

                if (profile) {
                    console.log("👤 Profile Found:", profile.role, "| Has Draft:", !!profile.draft_data)
                    setUserProfile(profile)
                    setUserRole(profile.role || 'client')
                    setClientName(profile.organization_name || "")
                    setOrganizationWebsite(profile.organization_website || "")

                    // Disable ALL draft loading if a reset was just performed
                    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
                    const isResetting = sessionStorage.getItem("cyrus_reset_active") || urlParams?.get('reset') === 'true'

                    if (!isResetting) {
                        if (profile.draft_data) {
                            cloudDraftData = profile.draft_data
                        } else {
                            // If no draft, try to load latest submitted assessment for viewing
                            const { data: latestAssessment } = await supabase
                                .from('assessments')
                                .select('*')
                                .eq('user_id', session.user.id)
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .maybeSingle()

                            if (latestAssessment && latestAssessment.submission_data) {
                                console.log("📄 Found Latest Submission - loading for view")
                                cloudDraftData = latestAssessment.submission_data
                            }
                        }
                    } else {
                        console.log("🔥 RESET ACTIVE: Skipping all historical data and drafts")
                    }

                    if (profile.industry) {
                        const normalized = normalizeIndustryId(profile.industry)
                        setSelectedIndustry(normalized)
                        setIsIndustryLocked(true)
                        profileIndustry = normalized
                    }
                } else {
                    setUserRole('client')
                }
            } else {
                setUserRole(null)
            }

            // 3. Draft Resolution (Cloud -> Local)
            let draftToLoad = cloudDraftData
            const userId = session?.user?.id
            const storageKey = userId ? `cyrus_draft_v2_${userId}` : "cyrus_draft_v2_guest"
            const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
            const isResettingLocal = sessionStorage.getItem("cyrus_reset_active") || urlParams?.get('reset') === 'true'

            if (!draftToLoad && !isResettingLocal) {
                const localSaved = localStorage.getItem(storageKey)
                if (localSaved) {
                    try {
                        draftToLoad = JSON.parse(localSaved)
                        console.log("📦 Found Local Draft")
                    } catch (e) {
                        console.error("Bad local draft", e)
                    }
                }
            }

            // 4. Apply State
            if (session?.user) {
                if (draftToLoad) {
                    console.log("📦 Applying draft to domains")
                    try {
                        if (draftToLoad.domains) {
                            finalDomains = finalDomains.map((d: Domain) => {
                                const savedD = draftToLoad.domains.find((sd: any) => sd.id === d.id || sd.name === d.name)
                                if (savedD) {
                                    return {
                                        ...d,
                                        activeWeight: d.activeWeight,
                                        questions: d.questions.map((q: any) => {
                                            const savedQ = savedD.questions?.find((sq: any) => sq.id === q.id || sq.text === q.text)
                                            return savedQ ? { ...q, response: savedQ.response } : q
                                        })
                                    }
                                }
                                return d
                            })
                        }
                        if (draftToLoad.selectedIndustry && !profileIndustry) {
                            setSelectedIndustry(normalizeIndustryId(draftToLoad.selectedIndustry))
                        }
                        if (draftToLoad.manualOverrideEnabled) setManualOverrideEnabled(draftToLoad.manualOverrideEnabled)
                        if (draftToLoad.currentDomainIndex !== undefined) setCurrentDomainIndex(draftToLoad.currentDomainIndex)
                        if (draftToLoad.currentQuestionIndex !== undefined) setCurrentQuestionIndex(draftToLoad.currentQuestionIndex)
                        if (draftToLoad.timestamp) setLastSavedTimestamp(draftToLoad.timestamp)
                        setHasDraft(true)
                    } catch (e) {
                        console.error("Error applying draft", e)
                    }
                } else {
                    console.log("✨ Starting fresh assessment for user")
                }
            } else {
                // Guest / No Auth fallback
                console.log("🔒 No active session - forcing clean state")
                localStorage.removeItem("cyrus_draft_v2_guest")
                setSelectedIndustry("")
                setClientName("")
                setManualOverrideEnabled(false)
                setHasDraft(false)
            }

            // 5. MFA Check
            const getMfaCookie = () => {
                if (typeof document === 'undefined') return false
                return document.cookie.split('; ').some(row => {
                    const [key, value] = row.trim().split('=')
                    return key === 'cyrus_mfa_verified' && value === 'true'
                })
            }
            const mfaStatus = sessionStorage.getItem("cyrus_mfa_authenticated") === "true" || getMfaCookie()
            setIsMfaVerified(mfaStatus)
            console.log("🛡️ [MFA Init]: Status:", mfaStatus ? "Verified" : "Pending")

            setDomains(finalDomains || JSON.parse(JSON.stringify(DOMAINS)))
            setIsLoading(false)
            sessionStorage.removeItem("cyrus_reset_active")

            // Clean up the URL to prevent subsequent resets on manual reloads
            if (typeof window !== 'undefined' && window.location.search.includes('reset=true')) {
                const newUrl = window.location.pathname
                window.history.replaceState({ path: newUrl }, '', newUrl)
            }
        }

        init()
    }, [])

    // 5. Auth State Change Listener (Cross-tab Sync)
    useEffect(() => {
        const supabase = createClient()
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("🔔 [Auth Listener]: Event:", event, "| User:", session?.user?.id || "None")
            
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : ""
            const isLoginPage = currentPath === '/login' || currentPath.startsWith('/auth/')

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (userProfile && session?.user?.id && session.user.id !== userProfile.id) {
                    console.warn("🔄 [Auth Listener]: Session mismatch detected. Reloading for account isolation.")
                    window.location.reload()
                }
            }

            if (event === 'SIGNED_OUT') {
                console.log("👋 [Auth Listener]: User signed out. Clearing state.")
                setUserRole(null)
                setUserProfile(null)
                setDomains([])
                
                // Only redirect if not already at login to prevent infinite reset loops
                if (!isLoginPage) {
                    window.location.href = '/login'
                }
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [userProfile])

    // 5. MFA Check
    useEffect(() => {
        if (!isLoading && userProfile && !isMfaVerified) {
            if (typeof window !== 'undefined') {
                const path = window.location.pathname
                const isLoginPage = path === '/login'
                const isAuthPage = path.startsWith('/auth/')
                
                if (!isLoginPage && !isAuthPage) {
                    console.log("🛡️ [MFA Gate]: Enforcement Active. Redirecting from", path, "to Identity Gateway")
                    window.location.href = '/login'
                } else {
                    console.log("🛡️ [MFA Gate]: User is at Identity Gateway (Awaiting Phase 3)")
                }
            }
        }
    }, [isLoading, userProfile, isMfaVerified])

    // Derived State
    const result: ScoringResult = useMemo(() => {
        if (domains.length === 0) return {
            totalScore: 0,
            domainScores: [],
            riskTier: "D",
            premiumLoading: "N/A",
            autoDeclined: false,
            failedKillers: [],
            volatilityScore: 0,
            normalizedScore: 0,
            declineNarrative: ""
        }
        return calculateScore(domains)
    }, [domains])

    const completionStats = useMemo(() => {
        if (domains.length === 0) return { total: 0, answered: 0, percentage: 0 }
        const totalQuestions = domains.reduce((sum: number, d: Domain) => sum + d.questions.length, 0)
        const answeredQuestions = domains.reduce(
            (sum: number, d: Domain) => sum + d.questions.filter((q: any) => q.response !== -1).length,
            0
        )
        const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
        return { total: totalQuestions, answered: answeredQuestions, percentage }
    }, [domains])

    const currentStep = useMemo(() => {
        if (completionStats.percentage === 0) return 1
        if (completionStats.percentage < 80) return 2
        if (completionStats.percentage < 100) return 3
        return 4
    }, [completionStats.percentage])

    // Actions
    const handleIndustryChange = useCallback((industryId: string) => {
        setSelectedIndustry(industryId)
        const profile = INDUSTRY_PROFILES.find(p => p.id === industryId)
        if (profile) {
            setDomains(prevDomains =>
                prevDomains.map((domain: Domain) => ({
                    ...domain,
                    activeWeight: profile.domainWeights[domain.name] || domain.defaultWeight
                }))
            )
        }
    }, [])

    const handleManualOverrideToggle = useCallback((enabled: boolean) => {
        setManualOverrideEnabled(enabled)
        if (!enabled && selectedIndustry) {
            const profile = INDUSTRY_PROFILES.find(p => p.id === selectedIndustry)
            if (profile) {
                setDomains(prevDomains =>
                    prevDomains.map((domain: Domain) => ({
                        ...domain,
                        activeWeight: profile.domainWeights[domain.name] || domain.defaultWeight
                    }))
                )
            }
        }
    }, [selectedIndustry])

    const handleDomainWeightChange = useCallback((domainId: string, newWeight: number) => {
        setDomains((prevDomains) =>
            prevDomains.map((domain: Domain) => (domain.id === domainId ? { ...domain, activeWeight: newWeight } : domain)),
        )
    }, [])

    const handleQuestionChange = useCallback((domainId: string, questionId: string, response: number) => {
        setDomains((prevDomains) =>
            prevDomains.map((domain: Domain) => {
                if (domain.id === domainId) {
                    return {
                        ...domain,
                        questions: domain.questions.map((question: any) =>
                            question.id === questionId ? { ...question, response } : question,
                        ),
                    }
                }
                return domain
            }),
        )
    }, [])

    const handleKillerToggle = useCallback((domainId: string, questionId: string, isKiller: boolean) => {
        setDomains((prevDomains) =>
            prevDomains.map((domain: Domain) => {
                if (domain.id === domainId) {
                    return {
                        ...domain,
                        questions: domain.questions.map((question: any) =>
                            question.id === questionId ? { ...question, isKiller } : question,
                        ),
                    }
                }
                return domain
            }),
        )
    }, [])

    const handleReset = useCallback(async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Disable historical fallback for the next reload
        sessionStorage.setItem("cyrus_reset_active", "true")

        // Identify and clear all possible storage keys
        const storageKeys = [
            user?.id ? `cyrus_draft_v2_${user.id}` : "cyrus_draft_v2_guest",
            "cyrus_draft_v2",
            "cyrus_draft_v2_guest",
            "cyrus_client_name",
            "cyrus_selected_industry",
            "reassurance_dismissed",
            "cyrus_current_step",
            "cyrus_last_saved",
            "cyrus_assessment_in_progress",
            user?.id ? `cyrus_cached_dossier_${user.id}` : "cyrus_cached_dossier_undefined"
        ]
        storageKeys.forEach(k => {
            localStorage.removeItem(k)
            sessionStorage.removeItem(k)
        })

        try {
            if (user) {
                // Clear the cloud draft permanently
                await supabase
                    .from('profiles')
                    .update({ draft_data: null })
                    .eq('id', user.id)
            }
        } catch (e) {
            console.error("Error clearing cloud draft", e)
        }

        // Reset local in-memory state
        await fetchQuestionnaire()
        setSelectedIndustry("")
        setClientName("")
        setOrganizationWebsite("")
        setManualOverrideEnabled(false)
        setCurrentDomainIndex(0)
        setCurrentQuestionIndex(0)
        setHasDraft(false)
        setLastSavedTimestamp(null)
    }, [fetchQuestionnaire])

    const saveDraft = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        setIsSaving(true)
        const draft = {
            domains,
            selectedIndustry,
            clientName,
            manualOverrideEnabled,
            currentDomainIndex,
            currentQuestionIndex,
            timestamp: new Date().toISOString()
        }

        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user

            const storageKey = user?.id ? `cyrus_draft_v2_${user.id}` : "cyrus_draft_v2_guest"
            localStorage.setItem(storageKey, JSON.stringify(draft))

            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        draft_data: { ...draft, model_version: MODEL_VERSION },
                        organization_name: clientName,
                        organization_website: organizationWebsite,
                        industry: selectedIndustry,
                        app_version: MODEL_VERSION
                    })
                    .eq('id', user.id)

                if (error) {
                    console.error("Failed to save cloud draft", error)
                    setIsSaving(false)
                    return { success: false, error: error.message }
                }
            }

            setLastSavedTimestamp(draft.timestamp)
            setHasDraft(true)
            setIsSaving(false)
            return { success: true }
        } catch (e: any) {
            console.error("Error saving draft", e)
            setIsSaving(false)
            return { success: false, error: e.message || "Unknown error" }
        }
    }, [domains, selectedIndustry, clientName, manualOverrideEnabled, currentDomainIndex, currentQuestionIndex])

    const autoSaveDraft = useCallback(async () => {
        const hasResponses = domains.some((d: Domain) => d.questions.some((q: any) => q.response !== -1))
        if (!hasResponses) return

        setIsSaving(true)
        const draft = {
            domains,
            selectedIndustry,
            clientName,
            manualOverrideEnabled,
            currentDomainIndex,
            currentQuestionIndex,
            timestamp: new Date().toISOString()
        }

        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user

            const storageKey = user?.id ? `cyrus_draft_v2_${user.id}` : "cyrus_draft_v2_guest"
            localStorage.setItem(storageKey, JSON.stringify(draft))

            if (user) {
                await supabase
                    .from('profiles')
                    .update({
                        draft_data: { ...draft, model_version: MODEL_VERSION },
                        organization_name: clientName,
                        organization_website: organizationWebsite,
                        industry: selectedIndustry,
                        app_version: MODEL_VERSION
                    })
                    .eq('id', user.id)
            }

            setLastSavedTimestamp(draft.timestamp)
            setHasDraft(true)
        } catch (e) {
            console.error("Auto-save failed", e)
        } finally {
            setIsSaving(false)
        }
    }, [domains, selectedIndustry, clientName, manualOverrideEnabled, currentDomainIndex, currentQuestionIndex])

    const submitAssessment = useCallback(async () => {
        setIsSaving(true)
        try {
            const supabase = createClient()
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user || (userProfile && user.id !== userProfile.id)) {
                console.error("🚫 Security Breach Prevented: Session mismatch during submitAssessment", authError)
                return { success: false, error: "Authentication session mismatch. Please refresh the page and log in again." }
            }

            const { data: insertedData, error } = await supabase.from('assessments').insert({
                user_id: user.id,
                industry_id: selectedIndustry || 'standard',
                total_score: result.totalScore,
                risk_tier: result.riskTier,
                premium_loading: result.premiumLoading,
                auto_declined: result.autoDeclined,
                submission_data: {
                    domains: domains.map((d: Domain) => ({
                        id: d.id,
                        name: d.name,
                        activeWeight: d.activeWeight,
                        questions: d.questions.map((q: any) => ({
                            id: q.id,
                            text: q.text,
                            response: q.response,
                            isKiller: q.isKiller
                        }))
                    })),
                    result,
                    clientName,
                    selectedIndustry,
                    model_version: MODEL_VERSION
                },
                model_version: MODEL_VERSION,
                schema_version: '1.0.0'
            }).select('id').single()

            if (error) {
                console.error("Submission error", error)
                return { success: false, error: error.message }
            }

            // Clear draft from storage only, but keep state for success view/dashboard
            const storageKey = user?.id ? `cyrus_draft_v2_${user.id}` : "cyrus_draft_v2_guest"
            localStorage.removeItem(storageKey)

            try {
                const supabase2 = createClient()
                await supabase2
                    .from('profiles')
                    .update({ draft_data: null })
                    .eq('id', user.id)
            } catch (e) {
                console.error("Error clearing cloud draft after submission", e)
            }

            // ==========================================
            // n8n / AUTOMATION DISPATCHER (Fire-and-forget)
            // ==========================================
            const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
            const n8nSecret = process.env.NEXT_PUBLIC_N8N_WEBHOOK_SECRET;
            
            if (n8nWebhookUrl && insertedData?.id) {
                try {
                    // PARANOID CHECK: Ensure URL has a protocol (http/https)
                    const finalUrl = n8nWebhookUrl.startsWith('http') ? n8nWebhookUrl : `https://${n8nWebhookUrl}`;
                    
                    console.log("🚀 [n8n Dispatch]: Initializing automation request...");
                    
                    // We do NOT await this. If n8n is down or slow, the user still proceeds instantly.
                    fetch(finalUrl, {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "X-Cyrus-Event-Secret": n8nSecret || "unsecured_dev_mode"
                        },
                        body: JSON.stringify({
                            event_type: "assessment_finalized",
                            assessment_id: insertedData.id,
                            user_id: user.id,
                            client_name: clientName,
                            industry_id: selectedIndustry || 'standard',
                            risk_tier: result.riskTier,
                            total_score: result.totalScore,
                            premium_loading: result.premiumLoading,
                            auto_declined: result.autoDeclined,
                            failed_killers: result.failedKillers,
                            timestamp: new Date().toISOString()
                        })
                    }).then(r => {
                        if (!r.ok) console.warn(`[n8n Dispatch]: Server returned status ${r.status}`);
                    }).catch(e => console.error("[n8n Dispatch Failed]:", e));
                } catch (dispatchError) {
                    console.error("[n8n Dispatch Initialization Failed]:", dispatchError);
                }
            }

            return { success: true, assessmentId: insertedData?.id }
        } catch (fatalError: any) {
            console.error("Fatal submission error:", fatalError)
            return { success: false, error: fatalError.message || "Failed to finalize assessment due to a network or security error." }
        } finally {
            setIsSaving(false)
        }
    }, [domains, selectedIndustry, result, clientName, userProfile])

    const updateProfile = useCallback(async (updates: any) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: "Not authenticated" }

        // CACHE INVALIDATION: If organization name changes, clear the old dossier
        const nameChanged = updates.organization_name && updates.organization_name !== userProfile?.organization_name
        const finalUpdates = { ...updates, app_version: MODEL_VERSION }
        
        if (nameChanged) {
            console.log("🏢 Organization changed. Invaliding old dossier.");
            finalUpdates.company_dossier = null;
            // Clear local cache too
            localStorage.removeItem(`cyrus_cached_dossier_${user.id}`);
        }

        const { error } = await supabase
            .from('profiles')
            .update(finalUpdates)
            .eq('id', user.id)

        if (error) {
            console.error("Profile update error", error)
            return { success: false, error: error.message }
        }

        setUserProfile((prev: any) => prev ? { ...prev, ...finalUpdates } : null)
        
        if (updates.organization_name) {
            setClientName(updates.organization_name)
        }
        if (updates.industry) {
            setSelectedIndustry(updates.industry)
        }
        if (updates.organization_website) {
            setOrganizationWebsite(updates.organization_website)
        }

        return { success: true }
    }, [userProfile, setSelectedIndustry])

    const signOut = useCallback(async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const storageKey = `cyrus_draft_v2_${user.id}`
            const cacheKey = `cyrus_cached_dossier_${user.id}`
            localStorage.removeItem(storageKey)
            localStorage.removeItem(cacheKey)
        }

        localStorage.removeItem("cyrus_draft_v2")
        localStorage.removeItem("cyrus_draft_v2_guest")
        localStorage.removeItem("cyrus_client_name")
        localStorage.removeItem("cyrus_selected_industry")
        sessionStorage.clear()
        
        // Clear MFA cookie
        if (typeof document !== 'undefined') {
            document.cookie = "cyrus_mfa_verified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        }
        
        setIsMfaVerified(false)

        await supabase.auth.signOut()
        window.location.href = '/login'
    }, [])

    const value = {
        userRole,
        isAdmin,
        domains,
        selectedIndustry,
        clientName,
        organizationWebsite,
        manualOverrideEnabled,
        isIndustryLocked,
        userProfile,
        currentDomainIndex,
        currentQuestionIndex,
        hasDraft,
        lastSavedTimestamp,
        isSaving,
        result,
        completionStats,
        currentStep,
        isLoading,
        setDomains,
        setSelectedIndustry: handleIndustryChange,
        setClientName,
        setManualOverrideEnabled: handleManualOverrideToggle,
        handleDomainWeightChange,
        handleQuestionChange,
        handleKillerToggle,
        handleReset,
        saveDraft,
        autoSaveDraft,
        submitAssessment,
        updateProfile,
        signOut,
        refreshData: fetchQuestionnaire,
        setCurrentDomainIndex,
        setCurrentQuestionIndex,
        isMfaVerified,
        setMfaVerified: setIsMfaVerified
    }

    return <UnderwritingContext.Provider value={value}>{children}</UnderwritingContext.Provider>
}

export function useUnderwriting() {
    const context = useContext(UnderwritingContext)
    if (context === undefined) {
        throw new Error("useUnderwriting must be used within an UnderwritingProvider")
    }
    return context
}

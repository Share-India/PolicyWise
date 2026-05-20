/**
 * CYRUS.PRO - Central Configuration Layer
 * This file pulls settings from environment variables to enable 
 * easy rebranding and AWS/Production scalability.
 */

export const siteConfig = {
    // Branding
    name: process.env.NEXT_PUBLIC_APP_NAME || "CYRUS.PRO",
    company: process.env.NEXT_PUBLIC_COMPANY_NAME || "Share India Insurance Brokers",
    tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Elite Cyber Risk Underwriting System",
    description: "Next-generation automated cyber insurance underwriting and risk analysis platform.",
    
    // Links
    url: process.env.NEXT_PUBLIC_SITE_URL || 
         (typeof window !== 'undefined' ? window.location.origin : "https://cyrus.shareindiainsurance.com"),
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@cyrus.pro",
    
    // AI Configuration
    ai: {
        defaultModel: process.env.AI_MODEL || "gemini-2.0-flash",
        maxTokens: 4096,
        temperature: 0.7,
    },

    // Risk Scoring Configuration
    scoring: {
        weights: {
            policyWeight: Number(process.env.SCORING_POLICY_WEIGHT) || 0.40,
            osintWeight: Number(process.env.SCORING_OSINT_WEIGHT) || 0.30,
            firmographicsWeight: Number(process.env.SCORING_FIRM_WEIGHT) || 0.30,
        },
        thresholds: {
            tierA: Number(process.env.THRESHOLD_TIER_A) || 90,
            tierB: Number(process.env.THRESHOLD_TIER_B) || 75,
            tierC: Number(process.env.THRESHOLD_TIER_C) || 60,
        },
        labels: {
            tierA: process.env.LABEL_TIER_A || "Base Rate",
            tierB: process.env.LABEL_TIER_B || "+20%",
            tierC: process.env.LABEL_TIER_C || "+50%",
            tierD: process.env.LABEL_TIER_D || "Decline",
        }
    },

    // Theme (Inject via CSS variables if possible)
    theme: {
        primaryColor: process.env.THEME_PRIMARY_COLOR || "#0047AB", // Default: SI Blue
    }
};

export type SiteConfig = typeof siteConfig;

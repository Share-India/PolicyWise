/**
 * SEED SCRIPT: SCORING ENGINE -> SUPABASE
 * This script reads the hardcoded data in scoring-engine.ts and seeds it into Supabase.
 * This is the first step towards a dynamic config system.
 */

import { createClient } from '@supabase/supabase-js'
import {
    INDUSTRY_PROFILES,
    DOMAINS,
    ALL_QUESTIONS,
    CERT_RELEVANCY_MAP
} from '../lib/scoring-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Prefer service role key to bypass RLS for seeding, fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
    console.log("🚀 Starting Model Seeding...")

    // 1. Seed Industries
    console.log("📍 Seeding Industries...")
    const industries = INDUSTRY_PROFILES.map(p => ({
        id: p.id,
        name: p.name
    }))
    const { error: indErr } = await supabase.from('industries').upsert(industries)
    if (indErr) console.error("❌ Industry Error:", indErr)

    // 2. Seed Domains
    console.log("📍 Seeding Domains...")
    // We already have domains in DB, but let's ensure they are up to date
    const domains = DOMAINS.map((d, index) => ({
        id: d.id,
        name: d.name,
        default_weight: d.defaultWeight,
        display_order: index
    }))
    const { error: domErr } = await supabase.from('domains').upsert(domains)
    if (domErr) console.error("❌ Domain Error:", domErr)

    // 3. Seed Industry Weights
    console.log("📍 Seeding Industry Weights...")
    const industryWeights: any[] = []
    INDUSTRY_PROFILES.forEach(profile => {
        Object.entries(profile.domainWeights).forEach(([domainName, weight]) => {
            // Find domain ID by name
            const domainId = DOMAINS.find(d => d.name === domainName)?.id
            if (domainId) {
                industryWeights.push({
                    industry_id: profile.id,
                    domain_id: domainId,
                    weight: weight
                })
            }
        })
    })
    const { error: weightErr } = await supabase.from('industry_weights').upsert(industryWeights)
    if (weightErr) console.error("❌ Weight Error:", weightErr)

    // 4. Seed Questions
    console.log("📍 Seeding Questions...")
    const questions = ALL_QUESTIONS.map(q => {
        const domainId = DOMAINS.find(d => d.name === q.domain)?.id
        return {
            id: q.id,
            domain_id: domainId,
            text: q.text,
            type: q.type,
            options: q.options,
            is_killer: q.isKiller
        }
    })

    // Process in batches due to size
    const batchSize = 50
    for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize)
        const { error: qErr } = await supabase.from('questions').upsert(batch)
        if (qErr) console.error(`❌ Question Batch ${i} Error:`, qErr)
    }

    console.log("✅ Seeding Complete!")
}

seed().catch(console.error)

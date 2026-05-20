import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json()

        // Normalize phone to E.164 format
        let normalizedPhone = phone.replace(/[\s\-()]/g, "")
        if (/^\d{10}$/.test(normalizedPhone)) {
            normalizedPhone = `+91${normalizedPhone}`
        }

        const supabase = createAdminClient()
 
        // 1. Look up the profile to get the Auth ID
        // Support multiple phone formats (with/without +, with/without 91)
        const raw = normalizedPhone.replace(/[\s\-()+]/g, "");
        const formats = Array.from(new Set([
            normalizedPhone,
            raw,
            `+${raw}`,
            raw.startsWith('91') ? raw.substring(2) : `91${raw}`,
            raw.startsWith('91') ? raw : `91${raw}`,
            `+91${raw.startsWith('91') ? raw.substring(2) : raw}`
        ])).filter(f => f.length >= 8);

        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .in('phone', formats)
            .limit(1)

        const profile = profiles?.[0];

        if (profileError || !profile) {
            console.error("[OTP Send] Profile not found for formats:", formats, profileError);
            return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
        }

        // MSG91 Credentials
        const authKey = process.env.MSG91_AUTH_KEY
        const templateId = process.env.MSG91_TEMPLATE_ID

        if (!templateId || !authKey) {
            return NextResponse.json({ error: 'MSG91 Config Error.' }, { status: 500 })
        }

        // Normalize mobile for MSG91: Ensure we have the '91' prefix
        let msg91Phone = normalizedPhone.replace(/\+/g, "").trim();
        if (msg91Phone.length === 10) {
            msg91Phone = "91" + msg91Phone;
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        // Using MSG91 FLOW API
        const msg91Url = `https://control.msg91.com/api/v5/flow/`
 
        const msg91Response = await fetch(msg91Url, { 
            method: 'POST',
            headers: {
                'authkey': authKey,
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                template_id: templateId,
                mobiles: msg91Phone,
                alphanumeric: "Cyber Risk Underwriting System",
                numeric: otp,
                var1: "Cyber Risk Underwriting System",
                var2: otp,
                otp: otp
            })
        })
        const msg91Result = await msg91Response.json()

        if (msg91Result.type === 'error') {
            console.error('[MSG91 Send Error]:', msg91Result)
            return NextResponse.json({ error: msg91Result.message || 'Failed to send OTP.' }, { status: 400 })
        }

        // Store OTP in Supabase Auth Metadata (avoids missing column issues in profiles)
        await supabase.auth.admin.updateUserById(profile.id, {
            user_metadata: { 
                last_otp: otp,
                otp_expiry: Date.now() + 15 * 60000 
            }
        })

        console.log(`[Phone OTP] Sent and stored in metadata for ${profile.email}`)
        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('[Send Phone OTP Error]:', err)
        return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 })
    }
}

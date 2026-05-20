import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { siteConfig } from '@/lib/site-config'

export async function POST(req: NextRequest) {
    try {
        const { phone, otp } = await req.json()

        // Normalize phone
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
            console.error("[OTP Verify] Profile not found for formats:", formats, profileError);
            return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
        }

        // 2. Look up the user's metadata from Auth
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id)
        const metadata = userData?.user?.user_metadata

        // 3. Verify OTP locally against metadata
        if (!metadata?.last_otp || metadata.last_otp !== otp) {
            console.log(`[Verify Fail] Expected: ${metadata?.last_otp}, Got: ${otp}`);
            return NextResponse.json(
                { error: 'Invalid or expired OTP. Please try again.' },
                { status: 400 }
            )
        }

        // OTP verified — generate magic link session
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: profile.email,
            options: {
                redirectTo: `${siteUrl}/auth/callback`
            }
        })

        if (linkError || !linkData?.properties?.action_link) {
            return NextResponse.json({ error: 'Session generation failed.' }, { status: 500 })
        }

        // Clear OTP from metadata
        await supabase.auth.admin.updateUserById(profile.id, {
            user_metadata: { ...metadata, last_otp: null }
        })

        console.log(`[Phone OTP] Verified for ${profile.email}`)
        return NextResponse.json({
            success: true,
            actionLink: linkData.properties.action_link
        })

    } catch (err: any) {
        console.error('[Verify Phone OTP Error]:', err)
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
    }
}

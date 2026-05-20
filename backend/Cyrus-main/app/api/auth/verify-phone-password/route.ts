import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { phone, password } = await req.json();

        if (!phone || !password) {
            return NextResponse.json({ error: "Phone and password required" }, { status: 400 });
        }

        // Use service role to bypass RLS for lookups
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Lookup the email associated with this phone number from the profiles table
        // We check multiple formats to be resilient to legacy data or different normalization styles
        const raw = phone.replace(/[\s\-()+]/g, "");
        const formats = Array.from(new Set([
            phone,
            raw,
            `+${raw}`,
            raw.startsWith('91') ? raw.substring(2) : `91${raw}`,
            raw.startsWith('91') ? raw : `91${raw}`,
            `+91${raw.startsWith('91') ? raw.substring(2) : raw}`
        ])).filter(f => f.length >= 8);

        const { data: profiles, error: lookupError } = await supabaseAdmin
            .from("profiles")
            .select("email")
            .in("phone", formats);

        if (lookupError || !profiles || profiles.length === 0) {
            console.error("[Login Proxy] Lookup Failed for formats:", formats, lookupError);
            return NextResponse.json({ error: "Account not found. Please verify your phone number." }, { status: 401 });
        }

        // 2. Iterative Verification: Try each matching email until one works with the password
        console.log(`🔍 [Login Proxy] Found ${profiles.length} potential matches. Attempting iterative verification...`);
        
        let authenticatedEmail = null;
        for (const profile of profiles) {
            const { error: authError } = await supabaseAdmin.auth.signInWithPassword({
                email: profile.email,
                password: password
            });
            
            if (!authError) {
                authenticatedEmail = profile.email;
                break;
            }
        }

        if (!authenticatedEmail) {
            return NextResponse.json({ error: "Invalid credentials. Please verify your password." }, { status: 401 });
        }

        // 3. Success! Return the specific email that was authenticated
        return NextResponse.json({ email: authenticatedEmail });

    } catch (error) {
        console.error("[Login Proxy] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

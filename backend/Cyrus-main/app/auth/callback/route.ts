import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { siteConfig } from '@/lib/site-config'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/welcome'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            const setMfaCookie = (res: NextResponse) => {
                res.cookies.set('cyrus_mfa_verified', 'true', { 
                    path: '/', 
                    // No maxAge/expires = session cookie
                    httpOnly: false, // Allow client-side context to read it
                    secure: !isLocalEnv,
                    sameSite: 'lax'
                })
            }

            if (isLocalEnv) {
                const res = NextResponse.redirect(`${origin}${next}`)
                setMfaCookie(res)
                return res
            } else if (forwardedHost && !forwardedHost.includes('localhost')) {
                const res = NextResponse.redirect(`https://${forwardedHost}${next}`)
                setMfaCookie(res)
                return res
            } else {
                // Final safety fallback to production domain
                const baseUrl = siteConfig.url
                const res = NextResponse.redirect(`${baseUrl}${next}`)
                setMfaCookie(res)
                return res
            }
        }
        
        console.error("❌ [Auth Callback Error]:", error.message);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Invalid auth code`)
}

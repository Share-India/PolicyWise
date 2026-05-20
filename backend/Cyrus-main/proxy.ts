import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const path = request.nextUrl.pathname

    console.log(`🛡️ [Proxy]: Path: ${path} | User: ${user?.id || 'None'}`)

    // MFA Check
    const mfaVerified = request.cookies.get('cyrus_mfa_verified')?.value === 'true'

    // Public routes
    const publicRoutes = ['/login', '/auth/callback']
    const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith('/auth/'))

    // Protected routes
    const protectedRoutes = ['/assessment', '/dashboard', '/submission', '/admin', '/welcome', '/settings']
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

    if (!user && isProtectedRoute) {
        console.log(`➡️ [Proxy]: Unauthenticated. Purging MFA state and redirecting ${path} to /login`)
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('next', path)
        
        const redirectResponse = NextResponse.redirect(url)
        // Break the loop: Clear the client's "verified" state if the server says they aren't logged in
        redirectResponse.cookies.set('cyrus_mfa_verified', 'false', { maxAge: 0 })
        return redirectResponse
    }

    // Force MFA if user exists but not verified (except for logout)
    if (user && !mfaVerified && isProtectedRoute) {
        console.log(`➡️ [Proxy]: MFA Missing. Redirecting ${path} to /login`)
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Role-based route enforcement
    if (user) {
        // Fetch user role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const userRole = profile?.role || 'client'

        const isAdminRoute = path.startsWith('/admin')
        const isClientRoute = path === '/assessment' || path === '/welcome' || path.startsWith('/submission')

        if (userRole === 'client' && isAdminRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/welcome'
            return NextResponse.redirect(url)
        }

        if (userRole === 'admin' && isClientRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }
    }

    /* 
    if (user && path === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/welcome'
        return NextResponse.redirect(url)
    }
    */

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

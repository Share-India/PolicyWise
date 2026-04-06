import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Toaster, toast } from 'react-hot-toast';

// Components
import Auth from './components/Auth';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import Analyzer from './components/Analyzer';
import Settings from './components/Settings';
import UpdatePassword from './components/UpdatePassword';
import PhoneVerificationGate from './components/PhoneVerificationGate';

export default function App() {
    const [session, setSession] = useState(null);
    const [role, setRole] = useState(null);
    const [fullName, setFullName] = useState(null);
    const [username, setUsername] = useState(null);
    const [phoneVerified, setPhoneVerified] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        let signupHandled = false;
        const handleSignupConfirmation = async () => {
            if (signupHandled) return true;
            if (window.location.hash && window.location.hash.includes('type=signup')) {
                signupHandled = true;
                // Remove the aggressive sign out so Supabase can seamlessly log the user in
                // window.history.replaceState(null, '', window.location.pathname); 
                toast.success("Email confirmed successfully! Securing account...", { id: 'email-confirm-toast' });
                return false; // Return false so initialization grabs the token and drops them into the Gate
            }
            return false;
        };

        const initializeSession = async () => {
            console.log("DEBUG: checkUser started");
            await handleSignupConfirmation();

            try {
                console.log("DEBUG: Awaiting supabase.auth.getSession()");
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();
                console.log("DEBUG: getSession returned", currentSession, error);

                if (!mounted) return;

                if (currentSession && !error) {
                    // Check if they are halfway through a phone verification signup
                    if (sessionStorage.getItem('signup_in_progress') === 'true') {
                        console.log("DEBUG: Abandoned mid-signup detected during refresh. Cleaning up.");
                        await supabase.auth.signOut();
                        sessionStorage.removeItem('signup_in_progress');
                        if (mounted) setLoading(false);
                        return;
                    }

                    await fetchUserData(currentSession.user.id);
                    // CRITICAL: Set session FIRST, then stop loading.
                    // This ensures the router always sees session+role together,
                    // preventing the brief session=null flash that redirected admins to /dashboard.
                    if (mounted) {
                        setSession(currentSession);
                        setLoading(false);
                    }
                } else {
                    if (mounted) setLoading(false);
                }
            } catch (err) {
                console.error("DEBUG: initial session check failed", err);
                if (mounted) setLoading(false);
            }
        };

        initializeSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (event === 'INITIAL_SESSION') return; // Handled reliably by initializeSession above
            if (await handleSignupConfirmation()) return;

            if (currentSession) {
                // If they are verifying OTP, wait for them to click "Create Account" before shifting the router
                if (sessionStorage.getItem('signup_in_progress') === 'true') {
                    console.log("DEBUG: Signup in progress, holding router at /login.");
                    return;
                }

                if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || !role) {
                    await fetchUserData(currentSession.user.id);
                }
                // Set session after profile fetch so router always sees consistent state
                if (mounted) setSession(currentSession);
            } else {
                if (mounted) {
                    setSession(null);
                    setRole(null);
                    setFullName(null);
                    setUsername(null);
                    setPhoneVerified(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserData = async (userId) => {
        console.log("DEBUG: fetchUserData started for user", userId);
        try {
            console.log("DEBUG: Awaiting profiles query...");
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Supabase Database Query TIMED OUT after 5s")), 5000)
            );

            const queryPromise = supabase
                .from('profiles')
                .select('role, full_name, username, phone')
                .eq('id', userId)
                .single();

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
            console.log("DEBUG: profiles query returned", data, error);

            if (data) {
                setRole(data.role);
                setFullName(data.full_name);
                setUsername(data.username);
                // If phone exists and isn't empty string, it's verified
                setPhoneVerified(!!data.phone);
            } else {
                // Profile not found — account was deleted. Sign out immediately.
                console.warn("DEBUG: Profile not found for user. Account may have been deleted. Signing out.", error);
                if (error) {
                    toast.error("Database Error: " + error.message, { duration: 6000 });
                } else {
                    toast.error("Critical Error: User profile missing in database. The Supabase trigger likely failed to create your profile row.", { duration: 8000 });
                }
                await supabase.auth.signOut();
                setSession(null);
                setRole(null);
                setFullName(null);
                setUsername(null);
                setPhoneVerified(null);
                setLoading(false);
            }
        } catch (err) {
            // NOTE: Do NOT set role='client' here — that would break admin users on a slow query.
            // The callers (initializeSession / onAuthStateChange) handle setLoading after this returns.
            console.error("DEBUG: Error fetching user profile data", err);
        }
        // setLoading(false) is intentionally NOT called here.
        // It is called by initializeSession after setSession(), so the router
        // always sees session+role together in the same render cycle.
    };

    // Auto-Logout if idle for 30 minutes
    useEffect(() => {
        let timeoutId;
        const resetTimer = () => {
            clearTimeout(timeoutId);
            if (session) {
                // 30 minutes = 1,800,000 milliseconds
                const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
                timeoutId = setTimeout(async () => {
                    console.log("DEBUG: User idle for too long. Forcing sign out.");
                    await supabase.auth.signOut();
                    toast.error("You have been signed out securely due to inactivity.", { duration: 6000 });
                }, IDLE_TIMEOUT_MS);
            }
        };

        if (session) {
            window.addEventListener('mousemove', resetTimer);
            window.addEventListener('mousedown', resetTimer);
            window.addEventListener('keydown', resetTimer);
            window.addEventListener('scroll', resetTimer);
            window.addEventListener('touchstart', resetTimer);
            resetTimer(); // Start the timer immediately upon mount/session
        }

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('mousedown', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('scroll', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
        };
    }, [session]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center font-sans bg-slate-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-slate-500 font-bold animate-pulse text-sm uppercase tracking-widest">Verifying Session...</div>
            </div>
        );
    }

    if (session && phoneVerified === false) {
        return (
            <>
                <Toaster position="top-right" />
                <PhoneVerificationGate session={session} onVerified={(newPhone) => setPhoneVerified(true)} />
            </>
        );
    }

    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
                {/* Public / Auth Route */}
                <Route
                    path="/login"
                    element={!session ? <Auth /> : <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />}
                />

                <Route
                    path="/update-password"
                    element={<UpdatePassword />}
                />

                {/* Client Routes */}
                <Route
                    path="/dashboard"
                    element={session && role === 'client' ? <ClientDashboard session={session} fullName={fullName} username={username} /> : <Navigate to="/login" replace />}
                />

                <Route
                    path="/analyze"
                    element={session ? <Analyzer session={session} fullName={fullName} username={username} /> : <Navigate to="/login" replace />}
                />

                <Route
                    path="/settings"
                    element={session ? <Settings session={session} fullName={fullName} username={username} onProfileUpdate={() => fetchUserData(session.user.id)} /> : <Navigate to="/login" replace />}
                />

                {/* Admin Routes */}
                <Route
                    path="/admin"
                    element={session && role === 'admin' ? <AdminDashboard session={session} fullName={fullName} /> : <Navigate to="/dashboard" replace />}
                />

                {/* Default Catch-all */}
                <Route
                    path="*"
                    element={session ? (role ? <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace /> : <div className="text-center p-20 font-bold opacity-50 uppercase tracking-widest text-xs">Redirecting...</div>) : <Navigate to="/login" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

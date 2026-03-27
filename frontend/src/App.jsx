import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Components
import Auth from './components/Auth';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import Analyzer from './components/Analyzer';
import Settings from './components/Settings';
import UpdatePassword from './components/UpdatePassword';

export default function App() {
    const [session, setSession] = useState(null);
    const [role, setRole] = useState(null);
    const [fullName, setFullName] = useState(null);
    const [username, setUsername] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        let signupHandled = false;
        const handleSignupConfirmation = async () => {
            if (signupHandled) return true;
            if (window.location.hash && window.location.hash.includes('type=signup')) {
                signupHandled = true;
                await supabase.auth.signOut();
                window.history.replaceState(null, '', window.location.pathname);
                alert("Email confirmed successfully! Please log in with your credentials.");
                setSession(null);
                setRole(null);
                setFullName(null);
                setUsername(null);
                setLoading(false);
                return true;
            }
            return false;
        };

        const initializeSession = async () => {
            console.log("DEBUG: checkUser started");
            if (await handleSignupConfirmation()) return;

            try {
                console.log("DEBUG: Awaiting supabase.auth.getSession()");
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();
                console.log("DEBUG: getSession returned", currentSession, error);
                
                if (!mounted) return;
                
                if (currentSession && !error) {
                    await fetchUserData(currentSession.user.id);
                    if (mounted) setSession(currentSession);
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
                // Background refresh shouldn't wipe the screen
                await fetchUserData(currentSession.user.id);
                if (mounted) setSession(currentSession);
            } else {
                if (mounted) {
                    setSession(null);
                    setRole(null);
                    setFullName(null);
                    setUsername(null);
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
                .select('role, full_name, username')
                .eq('id', userId)
                .single();

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
            console.log("DEBUG: profiles query returned", data, error);

            if (data) {
                setRole(data.role);
                setFullName(data.full_name);
                setUsername(data.username);
            } else {
                console.log("DEBUG: Profile missing for user, attempting repair...");
                const { data: { user } } = await Promise.race([
                    supabase.auth.getUser(),
                    new Promise(r => setTimeout(() => r({ data: { user: null } }), 3000))
                ]);
                
                if (user) {
                    const meta = user.user_metadata || {};
                    const fallbackName = meta.full_name || user.email?.split('@')[0] || "User";
                    const fallbackUsername = meta.username || (user.email?.split('@')[0] + Math.floor(Math.random() * 1000)) || `user_${userId.substring(0, 5)}`;

                    const { data: repaired, error: repairError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: userId,
                            full_name: fallbackName,
                            username: fallbackUsername,
                            email: user.email,
                        }, { onConflict: 'id' })
                        .select()
                        .single();

                    if (!repairError && repaired) {
                        setRole(repaired.role);
                        setFullName(repaired.full_name);
                        setUsername(repaired.username);
                    } else {
                        setRole('client');
                        setFullName(fallbackName);
                    }
                } else {
                    setRole('client');
                }
            }
        } catch (err) {
            console.error("DEBUG: Error fetching/repairing user data", err);
            setRole('client');
        } finally {
            console.log("DEBUG: fetchUserData FINALLY calling setLoading(false)");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center font-sans bg-slate-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-slate-500 font-bold animate-pulse text-sm uppercase tracking-widest">Verifying Session...</div>
            </div>
        );
    }

    return (
        <BrowserRouter>
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

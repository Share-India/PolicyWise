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
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        let signupHandled = false;
        const handleSignupConfirmation = async () => {
            if (signupHandled) return true;
            if (window.location.hash && window.location.hash.includes('type=signup')) {
                signupHandled = true;
                await supabase.auth.signOut();
                // Clear the hash from the URL so it doesn't get processed again
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

        const checkUser = async () => {
            if (await handleSignupConfirmation()) return;

            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    setSession(null);
                    setRole(null);
                    setFullName(null);
                    setUsername(null);
                    setLoading(false);
                } else {
                    const { data: { session: currentSession } } = await supabase.auth.getSession();
                    if (currentSession) {
                        await fetchUserData(currentSession.user.id);
                        setSession(currentSession);
                    } else {
                        setSession(null);
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error("Initial auth check failed:", err);
                setLoading(false);
            }
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log("Auth Event:", event);

            if (await handleSignupConfirmation()) return;

            if (currentSession) {
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    setLoading(true);
                }
                // Fetch data FIRST, then set session to trigger route changes
                await fetchUserData(currentSession.user.id);
                setSession(currentSession);
            } else {
                setSession(null);
                setRole(null);
                setFullName(null);
                setUsername(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserData = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, full_name, username')
                .eq('id', userId)
                .single();

            if (data) {
                setRole(data.role);
                setFullName(data.full_name);
                setUsername(data.username);
            } else {
                // AUTO-REPAIR: If profile is missing, create it from metadata
                console.log("Profile missing for user, attempting repair...");
                const { data: { user } } = await supabase.auth.getUser();
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
                            // role is omitted to respect existing database values or default to 'client'
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
            console.error("Error fetching/repairing user data", err);
            setRole('client');
        } finally {
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

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, User, Mail, Lock, ShieldCheck, Zap, Activity, FileSearch } from 'lucide-react';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // New Phase 1 Fix
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [loginUsername, setLoginUsername] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isResolvingUsername, setIsResolvingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [isValidatingUsername, setIsValidatingUsername] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [isValidatingEmail, setIsValidatingEmail] = useState(false);

    const navigate = useNavigate();

    // Reset states when switching tabs
    useEffect(() => {
        setUsernameError('');
        setEmailError('');
        setPassword('');
    }, [isLogin]);

    // Real-time Username Validation
    useEffect(() => {
        if (isLogin) {
            setUsernameError('');
            return;
        }

        const currentUsername = username.trim();

        if (username !== '' && !currentUsername) {
            setUsernameError('Username cannot be blank.');
            return;
        }

        if (username === '') {
            setUsernameError('');
            return;
        }

        if (/\s/.test(username)) {
            setUsernameError('Username cannot contain spaces.');
            return;
        }

        setIsValidatingUsername(true);
        setUsernameError('');

        const delayDebounceFn = setTimeout(async () => {
            try {
                const { data: isTaken, error } = await supabase.rpc('check_username', {
                    username_to_check: currentUsername
                });

                if (error) {
                    console.error("Error validating username:", error);
                    setUsernameError("Error checking username availability.");
                } else if (isTaken) {
                    setUsernameError("This username is already taken. Please choose another.");
                } else {
                    setUsernameError('');
                }
            } catch (err) {
                console.error("Validation err:", err);
            } finally {
                setIsValidatingUsername(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [username, isLogin]);

    // Real-time Email Validation
    useEffect(() => {
        if (isLogin) {
            setEmailError('');
            return;
        }

        const currentEmail = email.trim();
        if (!currentEmail) {
            setEmailError('');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(currentEmail)) {
            setEmailError('');
            return;
        }

        setIsValidatingEmail(true);
        setEmailError('');

        const delayDebounceFn = setTimeout(async () => {
            try {
                const { data: isTaken, error } = await supabase.rpc('check_email', {
                    email_to_check: currentEmail
                });

                if (error) {
                    setEmailError("Error checking email availability.");
                } else if (isTaken) {
                    setEmailError("This email address is already registered.");
                } else {
                    setEmailError('');
                }
            } catch (err) {
                console.error("Validation err:", err);
            } finally {
                setIsValidatingEmail(false);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [email, isLogin]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin && !isForgotPassword) {
                // 1. Resolve Username -> Email securely
                setIsResolvingUsername(true);
                const { data: resolvedEmail, error: lookupError } = await supabase.rpc('get_email_by_username', {
                    lookup_username: loginUsername.trim()
                });
                setIsResolvingUsername(false);

                if (lookupError) throw lookupError;
                if (!resolvedEmail) throw new Error("Invalid username or password."); // Vague error

                // 2. Sign in with the resolved email
                const { error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
                if (error) throw error;

                toast.success('Successfully signed in!', { duration: 3000 });

            } else if (!isLogin && !isForgotPassword) {
                if (!firstName.trim() || !lastName.trim() || !username.trim()) {
                    throw new Error("First Name, Surname, and Username are required for sign up.");
                }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                        data: {
                            full_name: `${firstName} ${lastName}`.trim(),
                            username: username.trim()
                        }
                    }
                });
                if (error) throw error;
                toast.success('Signup successful! Check your email if confirmation is required.', { duration: 6000 });
                setIsLogin(true);
                setPassword('');
            }
        } catch (error) {
            let msg = error.message;
            if (isLogin && (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials'))) {
                msg = "Invalid username or password.";
            } else if (!isLogin && msg.toLowerCase().includes('profiles_username_key')) {
                msg = "Username already exists. Please choose a different one!";
            }
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: resolvedEmail, error: lookupError } = await supabase.rpc('get_email_by_username', {
                lookup_username: loginUsername.trim()
            });

            if (lookupError || !resolvedEmail) {
                // To prevent enumeration, we act like it succeeded even if it failed
                toast.success(`If the username exists, a recovery link has been sent.`, { duration: 5000 });
                setLoginUsername('');
                return;
            }

            const { error } = await supabase.auth.resetPasswordForEmail(resolvedEmail, {
                redirectTo: `${window.location.origin}/update-password`,
            });
            if (error) throw error;

            toast.success(`If the username exists, a recovery link has been sent.`, { duration: 6000 });
            setLoginUsername('');
            setIsForgotPassword(false);

        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* LEFT PANEL - BRANDING (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 overflow-hidden items-center justify-center p-12">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
                <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>

                <div className="relative z-10 max-w-lg text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-xl">
                            <ShieldCheck className="w-10 h-10 text-blue-300" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">PolicyWise</h1>
                    </div>

                    <h2 className="text-3xl font-bold leading-tight mb-6">
                        Smart AI Insurance Analysis <br />
                        <span className="text-blue-300">for modern advisors.</span>
                    </h2>

                    <p className="text-lg text-blue-100/80 mb-10 leading-relaxed">
                        Instantly analyze, compare, and extract critical coverage details from dense health insurance policy documents using cutting-edge AI.
                    </p>

                    <div className="space-y-5">
                        <div className="flex items-center gap-4 text-blue-50">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-800/50 flex items-center justify-center border border-blue-400/30">
                                <Zap className="w-5 h-5 text-blue-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Instant Precision Parsing</h3>
                                <p className="text-sm text-blue-200">Extract exact coverage limits, sum insured, and Super Credit bonuses instantly.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-blue-50">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-800/50 flex items-center justify-center border border-blue-400/30">
                                <FileSearch className="w-5 h-5 text-blue-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Smart Policy Comparison</h3>
                                <p className="text-sm text-blue-200">Effortlessly compare features and exclusions across multiple health documents.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-blue-50">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-800/50 flex items-center justify-center border border-blue-400/30">
                                <ShieldCheck className="w-5 h-5 text-blue-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Regulatory Context</h3>
                                <p className="text-sm text-blue-200">Automatically identifies standard IRDAI-approved features and rights.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - AUTH FORM */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-white relative">

                {/* Mobile Header (Shows only on small screens) */}
                <div className="lg:hidden w-full max-w-md mb-8 flex items-center gap-3 justify-center">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">PolicyWise</h1>
                </div>

                <div
                    className="w-full max-w-md"
                    style={{ animation: 'slideUp 0.5s ease-out forwards' }}
                >
                    {!isForgotPassword && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-2">
                                {isLogin ? 'Welcome back' : 'Create your account'}
                            </h2>
                            <p className="text-slate-500 text-sm">
                                {isLogin ? 'Enter your details to access your workspace.' : 'Join PolicyWise to start analyzing policies.'}
                            </p>

                            {/* Toggle Pill */}
                            <div className="mt-6 flex p-1 bg-slate-100 rounded-lg">
                                <button
                                    onClick={() => setIsLogin(true)}
                                    type="button"
                                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${isLogin ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => setIsLogin(false)}
                                    type="button"
                                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${!isLogin ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    )}

                    {isForgotPassword ? (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
                            <p className="text-slate-500 text-sm">Enter your username to receive a secure recovery link.</p>
                        </div>
                    ) : null}

                    {/* FORGOT PASSWORD VIEW */}
                    {isForgotPassword ? (
                        <form className="space-y-5" onSubmit={handleResetPassword}>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Account Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text" required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                    />
                                </div>

                            </div>

                            <button
                                type="submit" disabled={loading || !loginUsername.trim()}
                                className="w-full flex justify-center py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Sending...
                                    </span>
                                ) : 'Send Secure Recovery Link'}
                            </button>

                            <div className="text-center mt-6">
                                <button type="button" onClick={() => { setIsForgotPassword(false); setLoginUsername(''); }} className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                                    &larr; Back to sign in
                                </button>
                            </div>
                        </form>
                    ) : (
                        // LOGIN & SIGN UP VIEW
                        <form className="space-y-5" onSubmit={handleAuth}>

                            {/* SIGN UP ONLY FIELDS */}
                            {!isLogin && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                                                placeholder="Choose a username"
                                                className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all sm:text-sm ${usernameError ? 'border-rose-300 bg-rose-50 focus:ring-rose-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-blue-500'}`}
                                            />
                                        </div>
                                        {isValidatingUsername && <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> Checking availability...</div>}
                                        {usernameError && <div className="text-xs text-rose-600 mt-1.5 font-medium">{usernameError}</div>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                            <input
                                                type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="John"
                                                className="appearance-none block w-full px-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Surname</label>
                                            <input
                                                type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Doe"
                                                className="appearance-none block w-full px-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Email field for Sign Up */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@company.com"
                                                className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all sm:text-sm ${emailError ? 'border-rose-300 bg-rose-50 focus:ring-rose-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-blue-500'}`}
                                            />
                                        </div>
                                        {!isLogin && isValidatingEmail && <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> Checking email...</div>}
                                        {!isLogin && emailError && <div className="text-xs text-rose-600 mt-1.5 font-medium">{emailError}</div>}
                                    </div>
                                </div>
                            )}

                            {/* USERNAME FIELD FOR LOGIN ONLY */}
                            {isLogin ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text" required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                                            placeholder="Enter your username"
                                            className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm"
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {/* PASSWORD FIELD */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-slate-700">Password</label>
                                    {isLogin && (
                                        <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required value={password} onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="appearance-none block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button
                                            type="button"
                                            className="text-slate-400 hover:text-slate-600 focus:outline-none"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit" disabled={loading || (!isLogin && (usernameError || emailError))}
                                    className="w-full flex justify-center py-3 px-4 shadow-md rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            {isLogin ? (isResolvingUsername ? 'Resolving Username...' : 'Authenticating...') : 'Creating account...'}
                                        </span>
                                    ) : (isLogin ? 'Sign In' : 'Create Account')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Inline Styles for Animation */}
            <style>{`
                @keyframes slideUp {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

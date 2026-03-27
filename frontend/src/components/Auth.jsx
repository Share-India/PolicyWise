import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [loginUsername, setLoginUsername] = useState(''); // [PHASE 24] Login Username
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false); // [PHASE 25] Forgot Password mode
    const [resetSuccessMsg, setResetSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [recoveryEmailObscured, setRecoveryEmailObscured] = useState('');
    const [resolvedRecoveryEmail, setResolvedRecoveryEmail] = useState('');
    const [isCheckingRecoveryUsername, setIsCheckingRecoveryUsername] = useState(false);
    const [usernameError, setUsernameError] = useState(''); // [PHASE 22] Username validation
    const [isValidatingUsername, setIsValidatingUsername] = useState(false);
    const [emailError, setEmailError] = useState(''); // [PHASE 23] Email validation
    const [isValidatingEmail, setIsValidatingEmail] = useState(false);
    const navigate = useNavigate();

    // [PHASE 22] Real-time Username Validation
    useEffect(() => {
        // Only validate if on Sign Up tab
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

        // Check for spaces
        if (/\s/.test(username)) {
            setUsernameError('Username cannot contain spaces.');
            return;
        }

        // Debounce the API call
        setIsValidatingUsername(true);
        setUsernameError('');

        const delayDebounceFn = setTimeout(async () => {
            try {
                // Call the secure RPC function to check existence 
                const { data: isTaken, error } = await supabase.rpc('check_username', {
                    username_to_check: currentUsername
                });

                if (error) {
                    console.error("Error validating username:", error);
                    setUsernameError("Error checking username availability.");
                } else if (isTaken) {
                    setUsernameError("This username is already taken. Please choose another.");
                } else {
                    setUsernameError(''); // Clear error if available
                }
            } catch (err) {
                console.error("Validation err:", err);
            } finally {
                setIsValidatingUsername(false);
            }
        }, 500); // 500ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [username, isLogin]);

    // [PHASE 23] Real-time Email Validation
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

        // Basic format check
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
                    console.error("Error validating email:", error);
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
        }, 800); // Wait longer because emails take longer to type

        return () => clearTimeout(delayDebounceFn);
    }, [email, isLogin]);

    // [PHASE 25] Real-time Recovery Email Lookup
    useEffect(() => {
        if (!isForgotPassword) {
            setRecoveryEmailObscured('');
            setResolvedRecoveryEmail('');
            setIsCheckingRecoveryUsername(false);
            return;
        }

        const currentUsername = loginUsername.trim();
        if (!currentUsername) {
            setRecoveryEmailObscured('');
            setResolvedRecoveryEmail('');
            setIsCheckingRecoveryUsername(false);
            return;
        }

        setIsCheckingRecoveryUsername(true);
        setErrorMsg('');
        setResetSuccessMsg('');

        const delayDebounceFn = setTimeout(async () => {
            try {
                const { data: resolvedEmail, error } = await supabase.rpc('get_email_by_username', {
                    lookup_username: currentUsername
                });

                if (error) {
                    console.error("Error fetching email:", error);
                    setRecoveryEmailObscured('');
                    setResolvedRecoveryEmail('');
                } else if (resolvedEmail) {
                    setResolvedRecoveryEmail(resolvedEmail);
                    // Obscure email for display
                    const [namePart, domainPart] = resolvedEmail.split('@');
                    let obscuredEmail = resolvedEmail;
                    if (namePart && domainPart) {
                        if (namePart.length <= 2) {
                            obscuredEmail = `${namePart[0]}***@${domainPart}`;
                        } else {
                            obscuredEmail = `${namePart.substring(0, 5)}***@${domainPart}`;
                        }
                    }
                    setRecoveryEmailObscured(obscuredEmail);
                } else {
                    setRecoveryEmailObscured('');
                    setResolvedRecoveryEmail('');
                }
            } catch (err) {
                console.error("Lookup err:", err);
            } finally {
                setIsCheckingRecoveryUsername(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [loginUsername, isForgotPassword]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setResetSuccessMsg('');

        try {
            if (isLogin && !isForgotPassword) {
                // [PHASE 24] USERNAME LOOKUP
                // 1. Resolve Username -> Email securely
                const { data: resolvedEmail, error: lookupError } = await supabase.rpc('get_email_by_username', {
                    lookup_username: loginUsername.trim()
                });

                if (lookupError) throw lookupError;
                if (!resolvedEmail) throw new Error("Username not found. Please check your username or sign up.");

                // 2. Sign in with the resolved email
                const { error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
                if (error) throw error;

            } else if (!isLogin && !isForgotPassword) {
                if (!firstName.trim() || !lastName.trim() || !username.trim()) {
                    throw new Error("First Name, Surname, and Username are required for sign up.");
                }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: `${firstName} ${lastName}`.trim(),
                            username: username.trim()
                        }
                    }
                });
                if (error) throw error;
                alert('Signup successful! Check your email if confirmation is required.');
            }

            // Force reload to trigger App.jsx state re-evaluation
            if (!isForgotPassword) {
                // window.location.reload();
            }

        } catch (error) {
            let msg = error.message;
            if (isLogin && (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials'))) {
                msg = "Invalid username or password.";
            } else if (!isLogin && msg.toLowerCase().includes('profiles_username_key')) {
                msg = "Username already exists. Please choose a different one!";
            }
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setResetSuccessMsg('');

        try {
            if (!resolvedRecoveryEmail) {
                throw new Error("Please enter a valid username first.");
            }

            // Request Password Reset using the already resolved email
            const { error } = await supabase.auth.resetPasswordForEmail(resolvedRecoveryEmail, {
                // Ensure the redirect points to our new UpdatePassword component
                redirectTo: `${window.location.origin}/update-password`,
            });
            if (error) throw error;

            setResetSuccessMsg(`A password recovery link has been sent to ${recoveryEmailObscured}`);

            // Clear inputs and states after brief delay to let user read success message
            setLoginUsername('');
            setRecoveryEmailObscured('');
            setResolvedRecoveryEmail('');

        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 pr-2">
                    PolicyWise
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Smart AI Insurance Analysis
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
                    {/* [PHASE 25] Forgot Password View */}
                    {isForgotPassword ? (
                        <form className="space-y-6" onSubmit={handleResetPassword}>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Account Username <span className="text-rose-500">*</span></label>
                                <p className="text-xs text-slate-500 mb-2 mt-1">Enter your username to find your registered email address.</p>
                                <div className="mt-1 relative">
                                    <input
                                        type="text" required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                                        placeholder="johndoe123"
                                        className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 transition-colors ${!isCheckingRecoveryUsername && loginUsername.trim() !== '' && !recoveryEmailObscured && !resetSuccessMsg ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                    />
                                </div>
                                {isCheckingRecoveryUsername && <div className="text-xs text-slate-500 mt-1">Looking up account...</div>}
                                {!isCheckingRecoveryUsername && loginUsername.trim() !== '' && !recoveryEmailObscured && !resetSuccessMsg && (
                                    <div className="text-xs text-rose-600 mt-1 font-medium">Username not found.</div>
                                )}
                                {!isCheckingRecoveryUsername && recoveryEmailObscured && !resetSuccessMsg && (
                                    <div className="text-sm text-emerald-600 mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded-md">
                                        Recovery link will be sent to: <strong>{recoveryEmailObscured}</strong>
                                    </div>
                                )}
                            </div>

                            {errorMsg && <div className="text-rose-600 text-sm font-medium">{errorMsg}</div>}
                            {resetSuccessMsg && <div className="text-emerald-600 text-sm font-medium p-3 bg-emerald-50 rounded-md border border-emerald-100">{resetSuccessMsg}</div>}

                            <div>
                                <button
                                    type="submit" disabled={loading || !resolvedRecoveryEmail}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? 'Sending link...' : 'Send Recovery Link'}
                                </button>
                            </div>
                            <div className="text-center mt-4 text-sm">
                                <button type="button" onClick={() => { setIsForgotPassword(false); setErrorMsg(''); setResetSuccessMsg(''); setRecoveryEmailObscured(''); setResolvedRecoveryEmail(''); }} className="font-medium text-slate-600 hover:text-slate-500">
                                    &larr; Back to sign in
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleAuth}>
                            {!isLogin && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Username <span className="text-rose-500">*</span></label>
                                        <div className="mt-1">
                                            <input
                                                type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                                                placeholder="johndoe123"
                                                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 transition-colors ${usernameError ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                            />
                                            {isValidatingUsername && <div className="text-xs text-slate-500 mt-1">Checking availability...</div>}
                                            {usernameError && <div className="text-xs text-rose-600 mt-1 font-medium">{usernameError}</div>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">First Name <span className="text-rose-500">*</span></label>
                                            <div className="mt-1">
                                                <input
                                                    type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                                                    placeholder="John"
                                                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Surname <span className="text-rose-500">*</span></label>
                                            <div className="mt-1">
                                                <input
                                                    type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                                                    placeholder="Doe"
                                                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* [PHASE 24] Username / Email Conditional Rendering */}
                            {isLogin ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Username <span className="text-rose-500">*</span></label>
                                    <div className="mt-1">
                                        <input
                                            type="text" required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                                            placeholder="johndoe123"
                                            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Email address <span className="text-rose-500">*</span></label>
                                    <div className="mt-1">
                                        <input
                                            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                            className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 transition-colors ${!isLogin && emailError ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                        />
                                        {!isLogin && isValidatingEmail && <div className="text-xs text-slate-500 mt-1">Checking email...</div>}
                                        {!isLogin && emailError && <div className="text-xs text-rose-600 mt-1 font-medium">{emailError}</div>}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-medium text-slate-700">Password <span className="text-rose-500">*</span></label>
                                    {isLogin && (
                                        <button type="button" onClick={() => { setIsForgotPassword(true); setErrorMsg(''); }} className="text-xs font-medium text-blue-600 hover:text-blue-500">
                                            Forgot Password?
                                        </button>
                                    )}
                                </div>
                                <div className="mt-1">
                                    <input
                                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            {errorMsg && <div className="text-rose-600 text-sm font-medium">{errorMsg}</div>}

                            <div>
                                <button
                                    type="submit" disabled={loading || (!isLogin && (!!usernameError || !!emailError))}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                                </button>
                            </div>
                        </form>
                    )}

                    {!isForgotPassword && (
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">Or</span>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
                                    className="font-medium text-blue-600 hover:text-blue-500 text-sm"
                                >
                                    {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

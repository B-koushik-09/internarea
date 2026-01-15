import React, { useState } from "react";
import { X, Mail, Lock, Phone, User, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoogleLogin: () => void;
    onStandardLogin: (identifier: string, pass: string) => Promise<void>;
    onSignup: (data: any) => Promise<void>;
    t?: any;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onGoogleLogin, onStandardLogin, onSignup, t }) => {
    const [view, setView] = useState<'login' | 'signup'>('login');

    // Login State
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    // Signup State
    const [signupData, setSignupData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });

    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onStandardLogin(identifier, password);
        setLoading(false);
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (signupData.password !== signupData.confirmPassword) {
            if (signupData.password.length < 6) {
                alert("Password must be at least 6 characters");
                return;
            }
        }

        setLoading(true);
        await onSignup({
            name: signupData.name,
            email: signupData.email,
            phone: signupData.phone,
            password: signupData.password
        });
        setLoading(false);
    };

    const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSignupData({ ...signupData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">{view === 'login' ? t?.login_header || 'Welcome Back' : t?.register_title || 'Create Account'}</h2>
                        <p className="text-sm text-gray-500 mt-2">{view === 'login' ? 'Please sign in to continue' : t?.register_subtitle || 'Join thousands of students and companies'}</p>
                    </div>

                    <button
                        onClick={onGoogleLogin}
                        className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-50 hover:shadow-sm transition-all duration-200 mb-6 group"
                    >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                        <span>{t?.login_google || "Continue with Google"}</span>
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500 font-medium">{t?.login_or || "Or"}</span>
                        </div>
                    </div>

                    {view === 'login' ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t?.login_email || "Email or Phone"}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        placeholder={t?.forgot_placeholder_email || "name@company.com"}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700">{t?.login_password || "Password"}</label>
                                    <Link href="/ForgotPassword" onClick={onClose} className="text-xs font-semibold text-blue-600 hover:text-blue-500">
                                        {t?.login_forgot || "Forgot Password?"}
                                    </Link>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? t?.admin_button_loading || "Signing in..." : t?.login_button || "Sign In"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignupSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t?.register_name || "Full Name"}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        value={signupData.name}
                                        onChange={handleSignupChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t?.register_email || "Email"}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        value={signupData.email}
                                        onChange={handleSignupChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t?.register_phone || "Phone"}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Phone size={18} />
                                    </div>
                                    <input
                                        name="phone"
                                        type="tel"
                                        required
                                        value={signupData.phone}
                                        onChange={handleSignupChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        placeholder="+91 98765..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t?.register_password || "Password"}</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            name="password"
                                            type="password"
                                            required
                                            value={signupData.password}
                                            onChange={handleSignupChange}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                            placeholder="••••••"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t?.register_confirm || "Confirm"}</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            value={signupData.confirmPassword}
                                            onChange={handleSignupChange}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                            placeholder="••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex justify-center items-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                        {t?.register_button_loading || "Creating Account..."}
                                    </>
                                ) : (
                                    <>
                                        {t?.register_button || "Create Account"}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                </div>

                <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
                    {view === 'login' ? (
                        <p className="text-sm text-gray-600">
                            {t?.login_new || "Don't have an account?"}{" "}
                            <button
                                onClick={() => setView('signup')}
                                className="font-semibold text-blue-600 hover:text-blue-500 focus:outline-none"
                            >
                                {t?.register_button || "Sign up"}
                            </button>
                        </p>
                    ) : (
                        <p className="text-sm text-gray-600">
                            {t?.register_already || "Already have an account?"}{" "}
                            <button
                                onClick={() => setView('login')}
                                className="font-semibold text-blue-600 hover:text-blue-500 focus:outline-none"
                            >
                                {t?.login_button || "Login"}
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginModal;

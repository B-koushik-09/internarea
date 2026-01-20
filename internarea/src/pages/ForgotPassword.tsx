import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { Mail, Phone, AlertTriangle, Key, Lock, CheckCircle2 } from "lucide-react";
import { useSelector } from "react-redux";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";
import { useRouter } from "next/router";


export default function ForgotPassword() {
    const currentLanguage = useSelector(selectLanguage);
    const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };
    const router = useRouter();



    const [step, setStep] = useState<'identifier' | 'verify' | 'reset' | 'display_pass'>('identifier');
    const [method, setMethod] = useState<'email' | 'phone'>('email');
    const [identifier, setIdentifier] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Step 1: Send OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Determine purpose based on method (email or phone)
            const purpose = method === 'email' ? 'FORGOT_PASSWORD_EMAIL' : 'FORGOT_PASSWORD_SMS';

            // UNIFIED ROUTE: Backend handles both email and phone
            // Daily limit is checked server-side for forgot password purposes
            const res = await axios.post("https://internarea-backend-kd6b.onrender.com/api/auth/send-otp", {
                identifier: identifier,
                purpose: purpose
            });

            if (res.data.otp) {
                // Show simulation alert if OTP is returned (Email flow usually, or dev mode)
                alert(`[SMS SIMULATION]\nYour Phone OTP is: ${res.data.otp}`);
            }

            toast.success(res.data.message || "OTP Sent!");
            setStep('verify');
        } catch (err: any) {
            console.error(err);
            // Show detailed error if available, else network error message
            const errMsg = err.response?.data?.error || err.message || "Failed to send OTP";
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Determine purpose based on method
            const purpose = method === 'email' ? 'FORGOT_PASSWORD_EMAIL' : 'FORGOT_PASSWORD_SMS';

            // UNIFIED ROUTE: Backend handles both email and phone verification
            await axios.post("https://internarea-backend-kd6b.onrender.com/api/auth/verify-otp", {
                identifier: identifier,
                otp,
                purpose: purpose
            });

            toast.success(t.fp_btn_verify + " Success"); // "Verify OTP Success"
            setStep('reset');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    // Helper: Generate Random Password (Letters only)
    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let ret = "";
        for (let i = 0, n = charset.length; i < 10; ++i) {
            ret += charset.charAt(Math.floor(Math.random() * n));
        }
        setNewPassword(ret);
        setConfirmPassword(ret);
        toast.info("Random password generated!");
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error(t.fp_pass_mismatch || "Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post("https://internarea-backend-kd6b.onrender.com/api/auth/reset-password", {
                identifier,
                otp,
                newPassword
            });
            toast.success(t.fp_success || "Password changed successfully.");
            setTimeout(() => {
                router.push("/"); // Redirect to home/login
            }, 3000);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        if (step === 'identifier') return t.forgot_title;
        if (step === 'verify') return t.fp_step2_title;
        if (step === 'display_pass') return "New Password";
        return t.fp_step3_title;
    }

    const getSubtitle = () => {
        if (step === 'identifier') return t.forgot_subtitle;
        if (step === 'verify') return t.fp_step2_subtitle;
        return t.fp_step3_subtitle;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
                        {getTitle()}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {getSubtitle()}
                    </p>
                </div>

                {step === 'identifier' && (
                    <>
                        <div className="flex justify-center space-x-4 mt-6">
                            <button
                                onClick={() => { setMethod('email'); setIdentifier(''); }}
                                className={`flex items-center px-4 py-2 rounded-lg border transition-all ${method === 'email'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                {t.forgot_email_btn}
                            </button>
                            <button
                                onClick={() => { setMethod('phone'); setIdentifier(''); }}
                                className={`flex items-center px-4 py-2 rounded-lg border transition-all ${method === 'phone'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Phone className="w-4 h-4 mr-2" />
                                {t.forgot_phone_btn}
                            </button>
                        </div>

                        <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
                            <div>
                                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                                    {method === 'email' ? t.forgot_email_label : "Phone Number"}
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        {method === 'email' ? (
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <Phone className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    <input
                                        id="identifier"
                                        name="identifier"
                                        type={method === 'email' ? "email" : "tel"}
                                        required
                                        className="focus:ring-blue-500 text-black focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                                        placeholder={method === 'email' ? t.forgot_placeholder_email : "Enter your phone number"}
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
                            >
                                {loading ? (t.fp_btn_processing || "Processing...") : (t.fp_step1_btn || "Send OTP")}
                            </button>
                        </form>
                    </>
                )}

                {step === 'verify' && (
                    <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t.fp_otp_label}
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Key className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="focus:ring-blue-500 focus:border-blue-500 text-black block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                                    placeholder={t.fp_otp_ph}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex  justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
                        >
                            {loading ? (t.fp_btn_processing || "Processing...") : (t.fp_btn_verify || "Verify OTP")}
                        </button>
                    </form>
                )}

                {step === 'reset' && (
                    <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                        <div className="flex justify-end mb-2">
                            <button
                                type="button"
                                onClick={generatePassword}
                                className="text-xs flex items-center text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1 rounded-full transition-colors"
                            >
                                🔄 {t.fp_btn_gen_pass}
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t.fp_new_pass_label}
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 text-black left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text" // Shown as text so user can see generated password initially, or password toggle? 
                                    // Requirement says: "Automatically filled... User can edit". 
                                    // Usually "password" type is safer, but "text" is better for visual verification of generated pass.
                                    // Let's keep it 'text' momentarily or 'password'. 
                                    // For UX, if I just generated it, I want to see it.
                                    // But standard is 'password'. I'll stick to 'password' but maybe add a toggle later.
                                    // Actually, for "Generate Random Password", usually it shows up in a text field or we make it type="text".
                                    // Let's use type="text" for now since it's a reset flow and user just decided to change it.
                                    // Or safer: type="text" if generated? No, let's just use text for simplicity as per "User can edit it if they want".
                                    required
                                    className="focus:ring-blue-500 text-black focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                                    placeholder="*******"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t.fp_confirm_pass_label}
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CheckCircle2 className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="focus:ring-blue-500 text-black focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                                    placeholder="*******"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-500/30"
                        >
                            {loading ? (t.fp_btn_processing || "Processing...") : (t.fp_btn_reset || "Reset Password")}
                        </button>
                    </form>
                )}

                {step === 'display_pass' && (
                    <div className="mt-8 text-center space-y-6">
                        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-green-800">Password Reset Successful</h3>
                            <p className="mt-2 text-sm text-green-600">Your new password is:</p>
                            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 font-mono text-xl font-bold text-gray-800 tracking-wider">
                                {newPassword}
                            </div>
                            <p className="mt-4 text-xs text-gray-500">
                                Please copy this password and keep it safe. You can change it after logging in.
                            </p>
                        </div>
                        <Link href="/register">
                            <button className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30">
                                Login Now
                            </button>
                        </Link>
                    </div>
                )}

                <div className="text-center">
                    <button
                        onClick={() => {
                            if (step === 'verify') setStep('identifier');
                            else if (step === 'reset') setStep('verify'); // Or identifier? Usually verify.
                            else router.push("/");
                        }}
                        className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    >
                        ← {t.forgot_back}
                    </button>
                </div>
            </div>
        </div>
    );
}

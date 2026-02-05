import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const OTPModal = ({ isOpen, onClose, email, onSuccess, purpose }) => {
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    if (!isOpen) return null;

    const handleVerify = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await axios.post("https://internarea-production.up.railway.app/api/auth/verify-otp", {
                identifier: email,
                otp,
                purpose: purpose // Include purpose for verification
            });
            if (res.data.status === "SUCCESS") {
                toast.success("OTP Verified!");
                onSuccess();
                onClose();
            } else {
                setError("Invalid OTP");
            }
        } catch (err) {
            console.error("Verify OTP Error:", err);
            setError(err.response?.data?.error || "Verification failed");
        }
        setLoading(false);
    };

    const handleSendOTP = async () => {
        setResending(true);
        try {
            // Trigger backend to send OTP with purpose
            const res = await axios.post("https://internarea-production.up.railway.app/api/auth/send-otp", {
                identifier: email,
                purpose: purpose // Include purpose for resend
            });
            console.log("Resend OTP Response:", res.data);
            toast.success(`OTP sent to ${email}`);
        } catch (err) {
            console.error("Resend OTP Error:", err);
            toast.error(err.response?.data?.error || "Failed to send OTP");
        }
        setResending(false);
    };

    // Convert purpose enum to user-friendly text
    const getPurposeText = (p) => {
        const purposeMap = {
            'LOGIN_CHROME_GOOGLE': 'Chrome Security: Verify to complete Google login',
            'LOGIN_CHROME_PASSWORD': 'Chrome Security: Verify to complete login',
            'LANGUAGE_FRENCH': 'Language Security: Verify to unlock French',
            'FORGOT_PASSWORD_EMAIL': 'Password Reset: Verify your identity',
            'FORGOT_PASSWORD_SMS': 'Password Reset: Verify your phone',
            'RESUME_PAYMENT': 'Resume Builder: Verify before payment (₹50)'
        };
        return purposeMap[p] || 'Please verify your email to proceed securely.';
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-[400px] border border-gray-100 transform transition-all scale-100">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-blue-100 p-3 rounded-full mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 text-center">Verification Required</h2>
                    <p className="text-gray-500 text-center text-sm mt-2 px-4">
                        {getPurposeText(purpose)}
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 6-digit OTP"
                            className="w-full text-center text-2xl tracking-[0.5em] font-bold text-gray-900 border-2 border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-gray-300 placeholder:tracking-normal placeholder:text-base bg-gray-50"
                            maxLength={6}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center justify-center text-red-500 text-sm bg-red-50 py-2 rounded-lg">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleVerify}
                        disabled={loading || otp.length !== 6}
                        className={`w-full py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-none
                        ${loading || otp.length !== 6
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:to-blue-600'}`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verifying...
                            </span>
                        ) : "Verify Now"}
                    </button>

                    <div className="flex justify-between items-center text-sm pt-2">
                        <button
                            onClick={handleSendOTP}
                            disabled={resending}
                            className={`font-semibold hover:underline ${resending ? 'text-gray-400' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                            {resending ? "Sending..." : `Resend OTP to ${email?.split('@')[0]}...`}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTPModal;

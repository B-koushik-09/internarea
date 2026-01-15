import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import OTPModal from "@/Components/Security/OTPModal";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";

export default function ResumeBuilder() {
    const user = useSelector(selectuser);
    const [details, setDetails] = useState({ name: "", education: "", skills: "", experience: "" });
    const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);

    const currentLanguage = useSelector(selectLanguage);
    const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

    const initialPayment = async () => {
        if (!user) {
            toast.error(t?.resume_login_req || "Login required");
            return;
        }
        setIsOTPModalOpen(true);
    };

    const handleOTPSuccess = async () => {
        try {
            const amount = 50;
            const orderRes = await axios.post("http://localhost:5000/api/subscription/create-order", { amount });

            const paymentId = "pay_resume_" + Date.now();

            await axios.post("http://localhost:5000/api/resume/create", {
                userId: user._id,
                details,
                paymentId
            });

            toast.success(t?.resume_success || "Resume built and saved to profile successfully!");
            setDetails({ name: "", education: "", skills: "", experience: "" });

        } catch (err: any) {
            toast.error("Failed to generate resume");
            console.error(err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 bg-gray-50 min-h-screen">
            <OTPModal
                isOpen={isOTPModalOpen}
                onClose={() => setIsOTPModalOpen(false)}
                email={user?.email}
                onSuccess={handleOTPSuccess}
                purpose={t?.resume_verification || "Resume Builder Payment Verification"}
            />

            <h2 className="text-3xl font-bold mb-8 text-center">{t?.resume_title || "Premium Resume Builder"}</h2>
            <div className="bg-white shadow p-8 rounded-lg">
                <div className="mb-4">
                    <p className="bg-blue-50 text-blue-700 p-2 rounded">
                        {t?.resume_cost || "Cost"}: <strong>₹50</strong> {t?.resume_per_resume || "per resume"}.
                    </p>
                </div>

                <div className="space-y-4">
                    <input
                        className="w-full border p-2 rounded"
                        placeholder={t?.resume_full_name || "Full Name"}
                        value={details.name}
                        onChange={e => setDetails({ ...details, name: e.target.value })}
                    />
                    <textarea
                        className="w-full border p-2 rounded"
                        placeholder={t?.resume_education || "Education"}
                        value={details.education}
                        onChange={e => setDetails({ ...details, education: e.target.value })}
                    />
                    <textarea
                        className="w-full border p-2 rounded"
                        placeholder={t?.resume_skills || "Skills"}
                        value={details.skills}
                        onChange={e => setDetails({ ...details, skills: e.target.value })}
                    />
                    <textarea
                        className="w-full border p-2 rounded"
                        placeholder={t?.resume_experience || "Experience"}
                        value={details.experience}
                        onChange={e => setDetails({ ...details, experience: e.target.value })}
                    />

                    <button
                        onClick={initialPayment}
                        className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 mt-4"
                    >
                        {t?.resume_pay_btn || "Verify OTP & Pay ₹50 to Generate"}
                    </button>
                </div>
            </div>
        </div>
    );
}

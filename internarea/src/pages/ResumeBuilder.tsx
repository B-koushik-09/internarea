import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import OTPModal from "@/Components/Security/OTPModal";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";

export default function ResumeBuilder() {
    const user = useSelector(selectuser);
    const [details, setDetails] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        education: "",
        skills: "",
        experience: "",
        achievements: "",
        strengths: "",
        personalDetails: "",
        photo: ""
    });
    const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
    const [isOTPVerified, setIsOTPVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPaymentWindowOpen, setIsPaymentWindowOpen] = useState(false);
    const [generatedResume, setGeneratedResume] = useState<any>(null);
    const [myResumes, setMyResumes] = useState<any[]>([]);

    const currentLanguage = useSelector(selectLanguage);
    const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

    // Resume price in USD (₹50 ≈ $0.60, but PayPal minimum is $1.00)
    const RESUME_PRICE_INR = 50;
    const RESUME_PRICE_USD = "1.00"; // Minimum PayPal amount

    // Check payment time window (10:00 AM - 11:00 AM IST)
    useEffect(() => {
        const checkTime = () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const istTime = new Date(utc + (3600000 * 5.5));
            const hour = istTime.getHours();
            setIsPaymentWindowOpen(hour === 10);
        };
        checkTime();
        const interval = setInterval(checkTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch user's existing resumes
    const fetchMyResumes = async () => {
        if (user?._id) {
            try {
                const res = await axios.get(`https://internarea-wy7x.vercel.app/api/resume/my/${user._id}`);
                setMyResumes(res.data);
            } catch (err) {
                console.error("Failed to fetch resumes:", err);
            }
        }
    };

    useEffect(() => {
        fetchMyResumes();
    }, [user]);


    // Validate form before proceeding
    const validateForm = () => {
        if (!details.name.trim()) {
            toast.error("Please enter your name");
            return false;
        }
        if (!details.education.trim()) {
            toast.error("Please enter your education details");
            return false;
        }
        if (!details.skills.trim()) {
            toast.error("Please enter your skills");
            return false;
        }
        return true;
    };

    // Step 1: Initiate OTP verification
    const initiatePayment = async () => {
        if (!user) {
            toast.error(t?.resume_login_req || "Login required");
            return;
        }
        if (!validateForm()) return;
        if (!isPaymentWindowOpen) {
            toast.error("Payments are allowed only between 10:00 AM and 11:00 AM IST");
            return;
        }
        setIsOTPModalOpen(true);
    };

    // Step 2: OTP success handler
    const handleOTPSuccess = () => {
        setIsOTPVerified(true);
        setIsOTPModalOpen(false);
        toast.success("OTP Verified! You can now proceed with payment.");
    };

    // Step 3: Create PayPal order (using resume-specific endpoint)
    const createPayPalOrder = async (): Promise<string> => {
        try {
            const response = await axios.post("https://internarea-wy7x.vercel.app/api/resume/create-order", {
                amount: RESUME_PRICE_USD,
                userId: user._id
            });
            return response.data.id;
        } catch (error: any) {
            console.error("[Resume] PayPal order creation failed:", error);
            toast.error(error.response?.data?.error || "Failed to create payment order");
            throw error;
        }
    };

    // Step 4: Capture PayPal payment and generate resume (using resume-specific endpoint)
    const capturePayPalOrder = async (orderID: string) => {
        try {
            setIsLoading(true);

            // Capture payment AND create resume in one call
            const captureRes = await axios.post("https://internarea-wy7x.vercel.app/api/resume/capture-order", {
                orderID,
                userId: user._id,
                details
            });

            setGeneratedResume(captureRes.data.resume);
            toast.success(t?.resume_success || "Resume built and saved to profile successfully!");
            setDetails({ name: "", email: "", phone: "", address: "", education: "", skills: "", experience: "", achievements: "", strengths: "", personalDetails: "", photo: "" });
            setIsOTPVerified(false);
            fetchMyResumes(); // Refresh the resume list

        } catch (err: any) {
            console.error("[Resume] Payment capture failed:", err);
            toast.error(err.response?.data?.error || "Failed to process payment");
        } finally {
            setIsLoading(false);
        }
    };

    // PayPal Client ID
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    const paypalOptions = {
        clientId: paypalClientId || "",
        currency: "USD",
        intent: "capture" as const,
        "disable-funding": "card,credit",
    };

    return (
        <PayPalScriptProvider options={paypalOptions}>
            <div className="max-w-4xl mx-auto py-12 px-4 bg-gray-50 min-h-screen">
                <OTPModal
                    isOpen={isOTPModalOpen}
                    onClose={() => setIsOTPModalOpen(false)}
                    email={user?.email}
                    onSuccess={handleOTPSuccess}
                    purpose="RESUME_PAYMENT"
                />

                <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
                    <FileText className="inline-block mr-2 text-blue-600" size={32} />
                    {t?.resume_title || "Premium Resume Builder"}
                </h2>

                {/* Payment Window Warning */}
                {!isPaymentWindowOpen && (
                    <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 text-center flex items-center justify-center gap-2">
                        <AlertCircle size={20} />
                        <span><strong>{t?.resume_payment_window_closed || "Payment Window Closed!"}</strong> {t?.resume_payment_window_msg || "You can only purchase between 10:00 AM and 11:00 AM IST."}</span>
                    </div>
                )}

                <div className="bg-white shadow-lg p-8 rounded-xl border border-gray-100">
                    <div className="mb-6">
                        <p className="bg-blue-50 text-blue-700 p-3 rounded-lg flex items-center justify-between">
                            <span>{t?.resume_cost || "Cost"}: <strong>₹{RESUME_PRICE_INR}</strong> {t?.resume_per_resume || "per resume"}</span>
                            <span className="text-xs text-blue-500">(~${RESUME_PRICE_USD} USD via PayPal)</span>
                        </p>
                    </div>

                    {/* Resume Form */}
                    <div className="space-y-6">
                        {/* Personal Information Section */}
                        <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 {t?.resume_personal_info || "Personal Information"}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t?.resume_full_name || "Full Name"} *</label>
                                    <input
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="John Doe"
                                        value={details.name}
                                        onChange={e => setDetails({ ...details, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t?.resume_email || "Email"}</label>
                                    <input
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="john@example.com"
                                        value={details.email}
                                        onChange={e => setDetails({ ...details, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t?.resume_phone || "Phone"}</label>
                                    <input
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="+91 9876543210"
                                        value={details.phone}
                                        onChange={e => setDetails({ ...details, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t?.resume_address || "Address"}</label>
                                    <input
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="City, State, Country"
                                        value={details.address}
                                        onChange={e => setDetails({ ...details, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Photo Upload Section */}
                        <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">📷 {t?.resume_photo || "Profile Photo"}</h3>
                            <div className="flex items-center gap-4">
                                {details.photo && (
                                    <img
                                        src={details.photo}
                                        alt="Preview"
                                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                    />
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 2 * 1024 * 1024) {
                                                    toast.error("Photo must be less than 2MB");
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setDetails({ ...details, photo: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-blue-50 file:text-blue-700
                                            hover:file:bg-blue-100 cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{t?.resume_photo_max || "Max 2MB. JPG, PNG supported."}</p>
                                </div>
                            </div>
                        </div>

                        {/* Education & Skills Section */}
                        <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎓 {t?.resume_edu_skills || "Education & Skills"}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t?.resume_education || "Education"} *</label>
                                    <textarea
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="B.Tech in Computer Science, XYZ University (2020-2024)"
                                        rows={2}
                                        value={details.education}
                                        onChange={e => setDetails({ ...details, education: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t?.resume_skills || "Skills"} *</label>
                                    <textarea
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="JavaScript, React, Node.js, Python, SQL..."
                                        rows={2}
                                        value={details.skills}
                                        onChange={e => setDetails({ ...details, skills: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Experience Section */}
                        <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">💼 {t?.resume_experience || "Experience"}</h3>
                            <textarea
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder="Software Intern at ABC Corp (Jun 2023 - Aug 2023)&#10;- Developed REST APIs&#10;- Worked with React frontend"
                                rows={4}
                                value={details.experience}
                                onChange={e => setDetails({ ...details, experience: e.target.value })}
                            />
                        </div>

                        {/* Achievements Section */}
                        <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 {t?.resume_achievements || "Achievements"}</h3>
                            <textarea
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder="- Won 1st place in Hackathon 2023&#10;- Dean's List for 3 semesters&#10;- Published research paper"
                                rows={3}
                                value={details.achievements}
                                onChange={e => setDetails({ ...details, achievements: e.target.value })}
                            />
                        </div>

                        {/* Strengths Section */}
                        <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">💪 {t?.resume_strengths || "Strengths"}</h3>
                            <textarea
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder="Problem-solving, Team collaboration, Quick learner, Attention to detail..."
                                rows={2}
                                value={details.strengths}
                                onChange={e => setDetails({ ...details, strengths: e.target.value })}
                            />
                        </div>

                        {/* Personal Details / About Me Section */}
                        <div className="pb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 {t?.resume_about_me || "About Me"}</h3>
                            <textarea
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder="A brief introduction about yourself, your career goals, hobbies, interests..."
                                rows={3}
                                value={details.personalDetails}
                                onChange={e => setDetails({ ...details, personalDetails: e.target.value })}
                            />
                        </div>

                        {/* Payment Flow */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            {!isOTPVerified ? (
                                // Step 1: Verify OTP Button
                                <button
                                    onClick={initiatePayment}
                                    disabled={!isPaymentWindowOpen}
                                    className={`w-full font-bold py-3 rounded-lg transition-all ${isPaymentWindowOpen
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        }`}
                                >
                                    🔐 {t?.resume_verify_otp || "Step 1: Verify OTP"}
                                </button>
                            ) : (
                                // Step 2: PayPal Button (after OTP verified)
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center gap-2">
                                        <CheckCircle size={20} />
                                        <span>OTP Verified! Complete payment below.</span>
                                    </div>
                                    <PayPalButtons
                                        style={{ layout: "vertical", shape: "pill" }}
                                        disabled={isLoading}
                                        createOrder={async () => {
                                            return await createPayPalOrder();
                                        }}
                                        onApprove={async (data) => {
                                            await capturePayPalOrder(data.orderID);
                                        }}
                                        onError={(err) => {
                                            console.error("[Resume PayPal] Error:", err);
                                            toast.error("PayPal error occurred");
                                        }}
                                        onCancel={() => {
                                            toast.info("Payment cancelled");
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Success: Show generated resume */}
                {generatedResume && (
                    <div className="mt-8 bg-green-50 border border-green-200 p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                            <CheckCircle size={24} />
                            Resume Generated Successfully!
                        </h3>
                        <p className="text-green-700">Your resume has been saved to your profile and will be automatically attached to future internship applications.</p>
                    </div>
                )}

                {/* My Resumes Section */}
                {myResumes.length > 0 && (
                    <div className="mt-10">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            📋 {t?.resume_my_resumes || "My Resumes"} ({myResumes.length})
                        </h3>
                        <div className="grid gap-6 md:grid-cols-2">
                            {myResumes.map((resume, index) => (
                                <div key={resume._id || index} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-bold text-gray-900">{resume.details?.name || "Unnamed Resume"}</h4>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{t?.resume_paid || "Paid"} ₹50</span>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="font-semibold text-gray-600">🎓 {t?.resume_education || "Education"}:</span>
                                            <p className="text-gray-800 mt-1">{resume.details?.education || "N/A"}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-600">💼 {t?.resume_skills || "Skills"}:</span>
                                            <p className="text-gray-800 mt-1">{resume.details?.skills || "N/A"}</p>
                                        </div>
                                        {resume.details?.experience && (
                                            <div>
                                                <span className="font-semibold text-gray-600">📊 {t?.resume_experience || "Experience"}:</span>
                                                <p className="text-gray-800 mt-1">{resume.details.experience}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                                        <span>{t?.resume_created || "Created"}: {new Date(resume.createdAt).toLocaleDateString()}</span>
                                        <span>ID: {resume.paymentId?.slice(-8) || "N/A"}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>💳 {t?.resume_secure_payments || "Secure payments powered by PayPal"}</p>
                    <p className="mt-1">📧 {t?.resume_receipt_email || "Receipt will be sent to your registered email"}</p>
                </div>
            </div>
        </PayPalScriptProvider>
    );
}

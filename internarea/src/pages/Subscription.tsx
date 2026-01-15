import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { selectuser, login } from "@/Feature/Userslice";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";
import { Crown, Check, Zap, Star } from "lucide-react";

// Declare Razorpay on window
declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function Subscription() {
    const user = useSelector(selectuser);
    const dispatch = useDispatch();
    const [isPaymentWindowOpen, setIsPaymentWindowOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState("Free");
    const [isLoading, setIsLoading] = useState(false);
    const [usageInfo, setUsageInfo] = useState<any>(null);

    const currentLanguage = useSelector(selectLanguage);
    const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

    const plans = [
        { name: "Free", price: 0, apps: 1, color: "bg-gray-100", borderColor: "border-gray-300", icon: Star },
        { name: "Bronze", price: 100, apps: 3, color: "bg-orange-50", borderColor: "border-orange-400", icon: Zap },
        { name: "Silver", price: 300, apps: 5, color: "bg-slate-100", borderColor: "border-slate-400", icon: Crown },
        { name: "Gold", price: 1000, apps: "Unlimited", color: "bg-yellow-50", borderColor: "border-yellow-400", icon: Crown }
    ];

    // Load Razorpay SDK
    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Check payment time window (10-11 AM IST)
    useEffect(() => {
        const checkTime = () => {
            const now = new Date();
            // Convert to IST
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const istTime = new Date(utc + (3600000 * 5.5));
            const hour = istTime.getHours();
            setIsPaymentWindowOpen(hour === 10);
        };
        checkTime();
        const interval = setInterval(checkTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch current subscription status
    useEffect(() => {
        const fetchStatus = async () => {
            if (user?._id) {
                try {
                    const [statusRes, limitRes] = await Promise.all([
                        axios.get(`http://localhost:5000/api/subscription/status/${user._id}`),
                        axios.get(`http://localhost:5000/api/subscription/check-limit/${user._id}`)
                    ]);
                    setCurrentPlan(statusRes.data.plan || "Free");
                    setUsageInfo(limitRes.data);
                } catch (err) {
                    console.error("Failed to fetch subscription status", err);
                }
            }
        };
        fetchStatus();
    }, [user]);

    const handleBuy = async (plan: any) => {
        if (!user) {
            toast.error(t?.sub_login_req || "Please login first");
            return;
        }
        if (plan.price === 0) return;

        if (!isPaymentWindowOpen) {
            toast.error(t?.sub_payment_limit || "Payments are allowed only between 10:00 AM and 11:00 AM IST");
            return;
        }

        setIsLoading(true);

        try {
            // Load Razorpay SDK
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toast.error("Failed to load payment gateway. Please try again.");
                setIsLoading(false);
                return;
            }

            // Create order on backend
            const orderRes = await axios.post("http://localhost:5000/api/subscription/create-order", {
                amount: plan.price
            });

            const order = orderRes.data;

            // ✅ REAL RAZORPAY CHECKOUT POPUP
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mock",
                amount: order.amount,
                currency: order.currency || "INR",
                name: "InternArea",
                description: `${plan.name} Plan Subscription`,
                order_id: order.id,
                handler: async (response: any) => {
                    try {
                        // Verify payment on backend
                        const verifyRes = await axios.post("http://localhost:5000/api/subscription/verify-payment", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: user._id,
                            plan: plan.name,
                            amount: plan.price
                        });

                        if (verifyRes.data.status === "success") {
                            toast.success(`🎉 ${t?.sub_success || "Successfully subscribed to"} ${plan.name} ${t?.sub_invoice || "plan! Invoice emailed."}`);
                            setCurrentPlan(plan.name);

                            // Update user in Redux with new plan
                            dispatch(login({
                                ...user,
                                subscription: {
                                    ...user.subscription,
                                    plan: plan.name,
                                    paymentDate: new Date()
                                }
                            }));

                            // Refresh usage info
                            const limitRes = await axios.get(`http://localhost:5000/api/subscription/check-limit/${user._id}`);
                            setUsageInfo(limitRes.data);
                        }
                    } catch (err: any) {
                        toast.error(err.response?.data?.error || "Payment verification failed");
                    }
                },
                prefill: {
                    name: user.name || "",
                    email: user.email || "",
                    contact: user.phone || ""
                },
                theme: {
                    color: "#3B82F6"
                },
                modal: {
                    ondismiss: () => {
                        setIsLoading(false);
                    }
                }
            };

            // Check if we have real Razorpay keys
            if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && window.Razorpay) {
                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } else {
                // Fallback to mock payment if no keys
                console.log("[Subscription] Using mock payment (no Razorpay keys)");
                const mockPayment = {
                    razorpay_order_id: order.id,
                    razorpay_payment_id: "pay_mock_" + Date.now(),
                    razorpay_signature: "mock_sig",
                    userId: user._id,
                    plan: plan.name,
                    amount: plan.price
                };

                const verifyRes = await axios.post("http://localhost:5000/api/subscription/verify-payment", mockPayment);
                if (verifyRes.data.status === "success") {
                    toast.success(`🎉 ${t?.sub_success || "Successfully subscribed to"} ${plan.name} ${t?.sub_invoice || "plan! Invoice emailed."}`);
                    setCurrentPlan(plan.name);
                    dispatch(login({
                        ...user,
                        subscription: { plan: plan.name, paymentDate: new Date() }
                    }));
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || t?.sub_failed || "Payment failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-4">
                {t?.sub_title || "Choose Your Plan"}
            </h2>

            {/* Current Plan & Usage Display */}
            {user && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
                    <p className="text-blue-800">
                        <span className="font-semibold">Current Plan:</span>{" "}
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {currentPlan}
                        </span>
                    </p>
                    {usageInfo && (
                        <p className="text-blue-700 mt-2 text-sm">
                            Applications this month: <strong>{usageInfo.used}</strong> / {usageInfo.limit}
                        </p>
                    )}
                </div>
            )}

            {/* Payment Window Warning */}
            {!isPaymentWindowOpen && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg relative mb-8 text-center" role="alert">
                    <strong className="font-bold">🕐 {t?.sub_window_closed || "Payment Window Closed!"} </strong>
                    <span className="block sm:inline">
                        {t?.sub_window_msg || "You can only purchase subscriptions between 10:00 AM and 11:00 AM IST."}
                    </span>
                </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {plans.map((plan) => {
                    const isCurrentPlan = currentPlan === plan.name;
                    const IconComponent = plan.icon;

                    return (
                        <div
                            key={plan.name}
                            className={`${plan.color} rounded-xl shadow-lg p-6 flex flex-col items-center 
                                transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                                border-2 ${isCurrentPlan ? plan.borderColor + ' ring-2 ring-offset-2 ring-blue-500' : 'border-transparent'}`}
                        >
                            {isCurrentPlan && (
                                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                                    ✓ Current Plan
                                </span>
                            )}

                            <IconComponent className={`w-10 h-10 mb-3 ${plan.name === 'Gold' ? 'text-yellow-500' : 'text-gray-600'}`} />

                            <h3 className="text-2xl font-bold mb-2 text-gray-800">{plan.name}</h3>
                            <p className="text-4xl font-bold mb-4 text-gray-900">
                                {plan.price === 0 ? "Free" : `₹${plan.price}`}
                                {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/month</span>}
                            </p>

                            <ul className="mb-6 space-y-2 text-center text-gray-600">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    {plan.apps === "Unlimited" ? "Unlimited" : `${plan.apps}/month`} Applications
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    {t?.sub_priority || "Priority Support"}
                                </li>
                                {plan.name === "Gold" && (
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        Premium Badge
                                    </li>
                                )}
                            </ul>

                            <button
                                onClick={() => handleBuy(plan)}
                                disabled={plan.price === 0 || isCurrentPlan || (!isPaymentWindowOpen && plan.price > 0) || isLoading}
                                className={`mt-auto px-6 py-2.5 rounded-full font-bold text-white transition-all w-full
                                    ${plan.price === 0 || isCurrentPlan ? 'bg-gray-400 cursor-not-allowed' :
                                        (!isPaymentWindowOpen ? 'bg-gray-400 cursor-not-allowed' :
                                            'bg-blue-600 hover:bg-blue-700 active:scale-95')}`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </span>
                                ) : isCurrentPlan ? (
                                    "Current Plan"
                                ) : plan.price === 0 ? (
                                    t?.sub_current || "Current Plan"
                                ) : (
                                    t?.sub_buy || "Buy Now"
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Info Section */}
            <div className="mt-12 text-center text-gray-500 text-sm">
                <p>💳 Secure payments powered by Razorpay</p>
                <p className="mt-1">📧 Invoice will be sent to your registered email after successful payment</p>
            </div>
        </div>
    );
}

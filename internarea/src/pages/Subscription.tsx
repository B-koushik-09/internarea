import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { selectuser, login } from "@/Feature/Userslice";
import { selectLanguage } from "@/Feature/LanguageSlice";
import { translations } from "@/utils/translations";
import { Crown, Check, Zap, Star } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function Subscription() {
    const user = useSelector(selectuser);
    const dispatch = useDispatch();
    const [isPaymentWindowOpen, setIsPaymentWindowOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState("Free");
    const [isLoading, setIsLoading] = useState(false);
    const [usageInfo, setUsageInfo] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    const currentLanguage = useSelector(selectLanguage);
    const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

    // Plan data with INR and USD prices
    const planData = [
        { key: "Free", price: 0, priceUSD: 0, apps: 1, color: "bg-gray-100", borderColor: "border-gray-300", icon: Star },
        { key: "Bronze", price: 100, priceUSD: 1.20, apps: 3, color: "bg-orange-50", borderColor: "border-orange-400", icon: Zap },
        { key: "Silver", price: 300, priceUSD: 3.60, apps: 5, color: "bg-slate-100", borderColor: "border-slate-400", icon: Crown },
        { key: "Gold", price: 1000, priceUSD: 12.00, apps: "Unlimited", color: "bg-yellow-50", borderColor: "border-yellow-400", icon: Crown }
    ];

    // Get translated plan name
    const getPlanName = (key: string) => {
        const nameKey = `sub_${key.toLowerCase()}` as keyof typeof t;
        return (t as any)[nameKey] || key;
    };

    // Check payment time window (10:00 AM - 11:00 AM IST - PRODUCTION)
    useEffect(() => {
        const checkTime = () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const istTime = new Date(utc + (3600000 * 5.5));
            const hour = istTime.getHours();
            // PRODUCTION: Only allow 10:00 AM - 10:59 AM IST (hour === 10)
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
                        axios.get(`https://internarea-wy7x.vercel.app/api/subscription/status/${user._id}`),
                        axios.get(`https://internarea-wy7x.vercel.app/api/subscription/check-limit/${user._id}`)
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

    // Handle plan selection
    const handleSelectPlan = (plan: any) => {
        if (!user) {
            toast.error(t?.sub_login_req || "Please login first");
            return;
        }
        if (plan.price === 0) return;
        if (!isPaymentWindowOpen) {
            toast.error(t?.sub_payment_limit || "Payments are allowed only between 10:00 AM and 11:00 AM IST");
            return;
        }
        setSelectedPlan(plan);
    };

    // PayPal create order - send USD amount directly for proper formatting
    const createPayPalOrder = async (plan: any): Promise<string> => {
        console.log("[PayPal] Creating order for plan:", plan.key, "USD:", plan.priceUSD);

        try {
            // Validate plan has USD price
            if (!plan.priceUSD || plan.priceUSD <= 0) {
                throw new Error(`Invalid USD price for plan ${plan.key}: ${plan.priceUSD}`);
            }

            // Send USD amount with proper 2 decimal places format
            const usdAmount = plan.priceUSD.toFixed(2);
            console.log("[PayPal] Sending to backend - USD amount:", usdAmount);

            const response = await axios.post("https://internarea-wy7x.vercel.app/api/subscription/create-paypal-order", {
                amount: usdAmount,  // USD amount with 2 decimals
                amountINR: plan.price,  // Original INR for reference
                plan: plan.key,
                userId: user._id
            });

            console.log("[PayPal] Order created successfully:", response.data);

            // PayPal expects the order ID as a string
            if (!response.data.id) {
                throw new Error("No order ID returned from backend");
            }

            return response.data.id;
        } catch (error: any) {
            console.error("[PayPal] Order creation failed:", error.response?.data || error.message || error);
            const errorMsg = error.response?.data?.error || error.message || "Failed to create order";
            toast.error(errorMsg);
            throw error; // Re-throw to let PayPal SDK know it failed
        }
    };



    // PayPal capture payment
    const capturePayPalOrder = async (orderID: string, plan: any) => {
        try {
            setIsLoading(true);
            const usdAmount = plan.priceUSD.toFixed(2);

            const response = await axios.post("https://internarea-wy7x.vercel.app/api/subscription/capture-paypal-order", {
                orderID,
                userId: user._id,
                plan: plan.key,
                amount: usdAmount  // USD amount for consistency
            });

            if (response.data.status === "success") {
                toast.success(`🎉 ${t?.sub_success || "Successfully subscribed to"} ${getPlanName(plan.key)} ${t?.sub_invoice || "plan! Invoice emailed."}`);
                setCurrentPlan(plan.key);
                setSelectedPlan(null);

                dispatch(login({
                    ...user,
                    subscription: { ...user.subscription, plan: plan.key, paymentDate: new Date() }
                }));

                const limitRes = await axios.get(`https://internarea-production.up.railway.app/api/subscription/check-limit/${user._id}`);
                setUsageInfo(limitRes.data);
            }
        } catch (error: any) {
            console.error("PayPal capture failed:", error.response?.data || error);
            toast.error(error.response?.data?.error || "Payment failed");
        } finally {
            setIsLoading(false);
        }
    };

    // PayPal Client ID - NO fallback to "sb" (that's invalid)
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    // Show error if PayPal is not configured
    if (!paypalClientId) {
        console.error("❌ Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID in .env.local");
    }

    // PayPal options - must match backend currency (USD)
    // disableFunding removes debit/credit card options - PayPal only
    const paypalOptions = {
        clientId: paypalClientId || "",
        currency: "USD",
        intent: "capture" as const,
        "disable-funding": "card,credit",  // Hides debit/credit card options
    };

    return (
        <PayPalScriptProvider options={paypalOptions}>
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-4">
                    {t?.sub_title || "Choose Your Plan"}
                </h2>

                {/* Current Plan Display */}
                {user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
                        <p className="text-blue-800">
                            <span className="font-semibold">{t?.sub_current_plan_label || "Current Plan:"}</span>{" "}
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                {getPlanName(currentPlan)}
                            </span>
                        </p>
                        {usageInfo && (
                            <p className="text-blue-700 mt-2 text-sm">
                                {t?.sub_apps_this_month || "Applications this month:"} <strong>{usageInfo.used}</strong> / {usageInfo.limit}
                            </p>
                        )}
                    </div>
                )}

                {/* Payment Window Warning */}
                {!isPaymentWindowOpen && (
                    <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-8 text-center">
                        <strong>🕐 {t?.sub_window_closed || "Payment Window Closed!"} </strong>
                        <span>{t?.sub_window_msg || "You can only purchase subscriptions between 10:00 AM and 11:00 AM IST."}</span>
                    </div>
                )}

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {planData.map((plan) => {
                        const isCurrentPlan = currentPlan === plan.key;
                        const IconComponent = plan.icon;
                        const translatedName = getPlanName(plan.key);
                        const isSelected = selectedPlan?.key === plan.key;

                        return (
                            <div
                                key={plan.key}
                                className={`${plan.color} rounded-xl shadow-lg p-6 flex flex-col items-center 
                                    transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                                    border-2 ${isCurrentPlan ? plan.borderColor + ' ring-2 ring-blue-500' :
                                        isSelected ? 'ring-2 ring-green-500 border-green-400' : 'border-transparent'}`}
                            >
                                {isCurrentPlan && (
                                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                                        ✓ {t?.sub_current || "Current Plan"}
                                    </span>
                                )}

                                <IconComponent className={`w-10 h-10 mb-3 ${plan.key === 'Gold' ? 'text-yellow-500' : 'text-gray-600'}`} />
                                <h3 className="text-2xl font-bold mb-2 text-gray-800">{translatedName}</h3>

                                <p className="text-4xl font-bold mb-1 text-gray-900">
                                    {plan.price === 0 ? (t?.sub_free || "Free") : `₹${plan.price}`}
                                </p>
                                {plan.price > 0 && (
                                    <p className="text-sm text-gray-500 mb-4">{t?.sub_per_month || "/month"}</p>
                                )}

                                <ul className="mb-6 space-y-2 text-center text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {plan.apps === "Unlimited" ? (t?.sub_unlimited || "Unlimited") : `${plan.apps}${t?.sub_per_month || "/month"}`} {t?.sub_apps || "Applications"}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {t?.sub_priority || "Priority Support"}
                                    </li>
                                    {plan.key === "Gold" && (
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            {t?.sub_premium_badge || "Premium Badge"}
                                        </li>
                                    )}
                                </ul>

                                {/* Button / PayPal */}
                                {plan.price === 0 || isCurrentPlan ? (
                                    <button disabled className="mt-auto px-6 py-2.5 rounded-full font-bold text-white bg-gray-400 cursor-not-allowed w-full">
                                        {t?.sub_current || "Current Plan"}
                                    </button>
                                ) : !isPaymentWindowOpen ? (
                                    <button disabled className="mt-auto px-6 py-2.5 rounded-full font-bold text-white bg-gray-400 cursor-not-allowed w-full">
                                        {t?.sub_window_closed || "Window Closed"}
                                    </button>
                                ) : isSelected ? (
                                    <div className="w-full mt-auto">
                                        <PayPalButtons
                                            style={{ layout: "vertical", shape: "pill" }}
                                            disabled={isLoading}
                                            createOrder={async () => {
                                                try {
                                                    const orderId = await createPayPalOrder(plan);
                                                    console.log("[PayPal Buttons] Order ID received:", orderId);
                                                    return orderId;
                                                } catch (err) {
                                                    console.error("[PayPal Buttons] createOrder error:", err);
                                                    throw err;
                                                }
                                            }}
                                            onApprove={async (data) => {
                                                console.log("[PayPal Buttons] Payment approved:", data);
                                                await capturePayPalOrder(data.orderID, plan);
                                            }}
                                            onError={(err) => {
                                                console.error("[PayPal Buttons] onError:", err);
                                                toast.error("PayPal error: " + (err?.message || "Payment failed"));
                                            }}
                                            onCancel={() => {
                                                console.log("[PayPal Buttons] Payment cancelled");
                                                toast.info("Payment cancelled");
                                                setSelectedPlan(null);
                                            }}
                                        />
                                        <button onClick={() => setSelectedPlan(null)} className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700">
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        className="mt-auto px-6 py-2.5 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all w-full"
                                    >
                                        {t?.sub_buy || "Buy Now"}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-gray-500 text-sm">
                    <p>💳 {t?.sub_secure_payments?.replace("Razorpay", "PayPal") || "Secure payments powered by PayPal"}</p>
                    <p className="mt-1">📧 {t?.sub_invoice_email || "Invoice will be sent to your registered email after successful payment"}</p>
                </div>
            </div>
        </PayPalScriptProvider>
    );
}

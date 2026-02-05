
import React, { useEffect } from "react";
import axios from "axios";

interface PhoneOTPProps {
    onVerified: (data: any) => void;
}

export default function PhoneOTP({ onVerified }: PhoneOTPProps) {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://www.phone.email/sign_in_button_v1.js";
        script.async = true;

        const container = document.querySelector(".pe_signin_button");
        if (container) {
            container.appendChild(script);
        }

        (window as any).phoneEmailListener = async function (userObj: any) {
            if (!userObj.user_json_url) {
                alert("Verification failed: Missing user data.");
                return;
            }

            try {
                const res = await axios.post("https://internarea-wy7x.vercel.app/api/auth/verify-phone", {
                    user_json_url: userObj.user_json_url
                });

                if (res.data.success) {
                    onVerified(res.data);
                } else {
                    alert(res.data.error || "Verification failed");
                }
            } catch (err: any) {
                console.error("Phone Verification Error:", err);
                alert(err.response?.data?.error || "Phone verification failed");
            }
        };

        return () => {
            // Cleanup if needed, though script might persist. 
            // Removing listener to avoid leaks if component unmounts/remounts
            delete (window as any).phoneEmailListener;
        }
    }, [onVerified]);

    return (
        <div className="flex justify-center my-6">
            <div className="pe_signin_button" data-client-id="15695407177920574360"></div>
        </div>
    );
}

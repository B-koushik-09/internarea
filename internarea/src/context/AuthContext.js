
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useDispatch } from "react-redux";
import { login, logout, setLoading } from "@/Feature/Userslice";
import axios from "axios";
import { getDeviceInfo } from "@/Components/Security/DeviceChecker";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLocalLoading] = useState(true);
    const dispatch = useDispatch();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setLocalLoading(true);
            if (fbUser) {
                try {
                    // 1. Get Device Info for consistent logging
                    const { browser, device, os } = getDeviceInfo();

                    // 2. Check Chrome Security State
                    const isChrome = browser === "Chrome";
                    const isSessionVerified = typeof window !== 'undefined' && sessionStorage.getItem("chrome_verified") === "true";
                    const isOtpPending = typeof window !== 'undefined' && sessionStorage.getItem("chrome_otp_pending") === "true";

                    // 🚨 If OTP is pending (set by Navbar before Firebase login), skip auto-sync
                    // The Navbar will handle the OTP flow
                    if (isChrome && isOtpPending) {
                        console.log("AuthContext: Chrome OTP pending, skipping auto-sync. Navbar will handle OTP.");
                        setLocalLoading(false);
                        dispatch(setLoading(false));
                        return; // Don't dispatch login or logout, let Navbar handle it
                    }

                    // If Chrome, we only consider it verified if the session flag is set. 
                    // Otherwise, false (which triggers OTP_REQUIRED from backend).
                    const otpVerified = isChrome ? isSessionVerified : true;

                    // 3. Sync with Backend to get full user profile (role, id, etc)
                    const res = await axios.post("http://localhost:5000/api/auth/record-login", {
                        email: fbUser.email,
                        name: fbUser.displayName,
                        device,
                        browser,
                        os,
                        ip: "127.0.0.1",
                        otpVerified: otpVerified,
                        isRefresh: true // Hint to backend this is a session restore
                    });

                    if (res.data.status === "SUCCESS") {
                        // Mark as verified in session to prevent future checks on reload
                        if (isChrome && typeof window !== 'undefined') {
                            sessionStorage.setItem("chrome_verified", "true");
                        }
                        setUser(fbUser);
                        dispatch(login(res.data.user));
                        console.log("AuthContext: User synced with backend:", res.data.user);

                    } else if (res.data.status === "OTP_REQUIRED") {
                        console.log("AuthContext: Login blocked by Chrome Security. Waiting for OTP.");
                        // DO NOT dispatch login. The Navbar or Login Modal will handle the OTP flow.
                        // We leave user as null in Redux, but Firebase is signed in.
                        // This allows the OTP logic to proceed without showing the user as "Logged In".
                        setUser(null);
                        dispatch(logout()); // Ensure blocked

                    } else {
                        console.warn("AuthContext: Backend sync failed, using Firebase fallback. Status:", res.data.status);
                        // Only fallback if NOT a security block (e.g. server error)
                        // But strictly, we should probably fail safe. 
                        // For now, preserving original fallback behavior for non-security errors
                        setUser(fbUser);
                        dispatch(login({
                            uid: fbUser.uid,
                            email: fbUser.email,
                            displayName: fbUser.displayName,
                            photoURL: fbUser.photoURL
                        }));
                    }

                } catch (e) {
                    console.error("Auth Sync Error", e);
                    // Fallback to basic details from Firebase if API fails?
                    // Better to retry or show error, but for now lets keep the session alive
                    setUser(fbUser);
                    dispatch(login({
                        uid: fbUser.uid,
                        email: fbUser.email,
                        name: fbUser.displayName,
                        photo: fbUser.photoURL
                    }));
                }
            } else {
                setUser(null);
                dispatch(logout());
            }
            setLocalLoading(false);
            dispatch(setLoading(false));
        });

        return () => unsubscribe();
    }, [dispatch]);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

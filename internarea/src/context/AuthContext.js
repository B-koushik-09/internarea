
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useDispatch, useSelector } from "react-redux";
import { login, logout, setLoading, selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { getDeviceInfo } from "@/Components/Security/DeviceChecker";

const AuthContext = createContext(null);

// 🔑 Helper to check for cached standard login user
const getCachedUser = () => {
    if (typeof window !== 'undefined') {
        try {
            const savedUser = localStorage.getItem("internarea_user");
            if (savedUser) {
                return JSON.parse(savedUser);
            }
        } catch (e) {
            console.error("Error reading cached user:", e);
        }
    }
    return null;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLocalLoading] = useState(true);
    const dispatch = useDispatch();
    const initialLoadDone = useRef(false);

    useEffect(() => {
        // 🔑 IMMEDIATE SESSION RESTORE: If we have a cached user, show them immediately
        // This provides instant session restore without waiting for Firebase
        if (!initialLoadDone.current) {
            const cachedUser = getCachedUser();
            if (cachedUser) {
                console.log("AuthContext: Restoring session from localStorage cache");
                setUser(cachedUser);
                dispatch(login(cachedUser));
                setLocalLoading(false);
                dispatch(setLoading(false));
            }
            initialLoadDone.current = true;
        }

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                // Firebase user exists - this is a Google login
                setLocalLoading(true);
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

                    // 🔑 KEY FIX: For page refresh scenarios, if Firebase user exists and was previously
                    // verified (chrome_verified flag exists), trust the session.
                    // Also check localStorage as a fallback for persistence across page refreshes
                    let otpVerified = true; // Default for non-Chrome browsers

                    if (isChrome) {
                        // Check both sessionStorage and localStorage for verified state
                        const localVerified = typeof window !== 'undefined' && localStorage.getItem("chrome_verified_" + fbUser.email) === "true";
                        otpVerified = isSessionVerified || localVerified;

                        // If we found verification in localStorage but not sessionStorage, restore it
                        if (localVerified && !isSessionVerified && typeof window !== 'undefined') {
                            sessionStorage.setItem("chrome_verified", "true");
                        }
                    }

                    // 3. Sync with Backend to get full user profile (role, id, etc)
                    const res = await axios.post("https://internarea-wy7x.vercel.app/api/auth/record-login", {
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
                        // Mark as verified in both session and local storage for persistence
                        if (isChrome && typeof window !== 'undefined') {
                            sessionStorage.setItem("chrome_verified", "true");
                            localStorage.setItem("chrome_verified_" + fbUser.email, "true");
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

                    // 🔑 RESILIENT SESSION RESTORE
                    // If API fails but Firebase user exists and was previously verified,
                    // keep the session alive using cached Firebase data
                    const { browser } = getDeviceInfo();
                    const isChrome = browser === "Chrome";
                    const localVerified = typeof window !== 'undefined' && localStorage.getItem("chrome_verified_" + fbUser.email) === "true";

                    // For non-Chrome browsers OR verified Chrome sessions, restore from Firebase
                    if (!isChrome || localVerified) {
                        console.log("AuthContext: API failed but using cached Firebase user data");
                        setUser(fbUser);
                        dispatch(login({
                            uid: fbUser.uid,
                            email: fbUser.email,
                            name: fbUser.displayName,
                            photo: fbUser.photoURL
                        }));
                    } else {
                        // Chrome browser without prior verification - don't auto-login
                        console.log("AuthContext: API failed and Chrome not verified - staying logged out");
                        setUser(null);
                        dispatch(logout());
                    }
                }
                setLocalLoading(false);
                dispatch(setLoading(false));
            } else {
                // 🔑 NO Firebase user - but DON'T logout if we have a standard login session!
                // Standard login users (email/password) don't use Firebase, so fbUser will be null
                // Only logout if there's also no cached user from standard login
                const cachedUser = getCachedUser();
                if (cachedUser) {
                    console.log("AuthContext: No Firebase user but found cached standard login session");
                    setUser(cachedUser);
                    // Don't dispatch logout - keep the cached session
                } else {
                    console.log("AuthContext: No Firebase user and no cached session - user is logged out");
                    setUser(null);
                    dispatch(logout());
                }
                setLocalLoading(false);
                dispatch(setLoading(false));
            }
        });

        return () => unsubscribe();
    }, [dispatch]); // Only dispatch as dependency - no reduxUser to prevent infinite loop

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

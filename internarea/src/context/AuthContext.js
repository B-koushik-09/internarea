
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useDispatch, useSelector } from "react-redux";
import { login, logout, setLoading, selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { getDeviceInfo } from "@/Components/Security/DeviceChecker";
import { logout as logoutAction } from "@/Feature/Userslice";
import { API_URL } from "@/utils/apiConfig";
 
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Session expired or invalid (401). Logging out...");
            localStorage.removeItem("token");
            localStorage.removeItem("internarea_user");
            sessionStorage.removeItem("chrome_verified");
             
            if (typeof window !== 'undefined') {
                window.location.href = "/";
            }
        }
        return Promise.reject(error);
    }
);

const AuthContext = createContext(null);
 
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
        if (!initialLoadDone.current) {
            const cachedUser = getCachedUser();
            if (cachedUser) {
                console.log("AuthContext: Restoring session from localStorage cache");
                setUser(cachedUser);
                dispatch(login(cachedUser));
            }
            // Always set loading to false after checking cache to avoid black screen
            setLocalLoading(false);
            dispatch(setLoading(false));
            initialLoadDone.current = true;
        }

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) { 
                setLocalLoading(true);
                try {
                    
                    const { browser, device, os } = getDeviceInfo();

                    const isChrome = browser === "Chrome";
                    const isSessionVerified = typeof window !== 'undefined' && sessionStorage.getItem("chrome_verified") === "true";
                    const isOtpPending = typeof window !== 'undefined' && sessionStorage.getItem("chrome_otp_pending") === "true";
                    if (isChrome && isOtpPending) {
                        console.log("AuthContext: Chrome OTP pending, skipping auto-sync. Navbar will handle OTP.");
                        setLocalLoading(false);
                        dispatch(setLoading(false));
                        return; 
                    }

                    let otpVerified = true; 

                    if (isChrome) {
                        const localVerified = typeof window !== 'undefined' && localStorage.getItem("chrome_verified_" + fbUser.email) === "true";
                        otpVerified = isSessionVerified || localVerified;

                        if (localVerified && !isSessionVerified && typeof window !== 'undefined') {
                            sessionStorage.setItem("chrome_verified", "true");
                        }
                    }

                    const res = await axios.post(`${API_URL}/api/auth/record-login`, {
                        email: fbUser.email,
                        name: fbUser.displayName,
                        device,
                        browser,
                        os,
                        ip: "127.0.0.1",
                        otpVerified: otpVerified,
                        isRefresh: true 
                    });

                    if (res.data.status === "SUCCESS") {
                        if (isChrome && typeof window !== 'undefined') {
                            sessionStorage.setItem("chrome_verified", "true");
                            localStorage.setItem("chrome_verified_" + fbUser.email, "true");
                        }
                        setUser(fbUser);
                        dispatch(login({ ...res.data.user, token: res.data.token }));
                        console.log("AuthContext: User synced with backend:", res.data.user);

                    } else if (res.data.status === "OTP_REQUIRED") {
                        console.log("AuthContext: Login blocked by Chrome Security. Waiting for OTP.");
                        // Keep loading as needed, but don't force a full Redux logout yet 
                        // as Navbar is handling the primary flow.
                        setUser(null);
                        setLocalLoading(false); 
                        dispatch(setLoading(false));
                        return;

                    } else {
                        console.warn("AuthContext: Backend sync failed, using Firebase fallback. Status:", res.data.status);
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

                    if (e.response?.status === 403 || e.response?.data?.status === "BLOCKED") {
                        console.warn("AuthContext: Access denied by backend rule. Logging out...");
                        try { await auth.signOut(); } catch (err) {}
                        setUser(null);
                        dispatch(logoutAction());
                        return;
                    }

                    const { browser } = getDeviceInfo();
                    const isChrome = browser === "Chrome";
                    const localVerified = typeof window !== 'undefined' && localStorage.getItem("chrome_verified_" + fbUser.email) === "true";

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
                        console.log("AuthContext: API failed and Chrome not verified - staying logged out");
                        setUser(null);
                        dispatch(logout());
                    }
                }
                setLocalLoading(false);
                dispatch(setLoading(false));
            } else {
                const cachedUser = getCachedUser();
                if (cachedUser) {
                    console.log("AuthContext: No Firebase user but found cached standard login session");
                    setUser(cachedUser); 
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
    }, [dispatch]); 

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

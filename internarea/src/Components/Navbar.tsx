import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth, provider } from "../firebase/firebase";
import { ChevronDown, ChevronUp, Search, Globe, Menu, X } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { selectuser, selectLoading, login, logout, setLoading as setAuthLoading } from "@/Feature/Userslice";
import { selectLanguage, setLanguage } from "@/Feature/LanguageSlice";
import OTPModal from "./Security/OTPModal";
import LoginModal from "./Security/LoginModal";
import { getDeviceInfo } from "./Security/DeviceChecker";
import axios from "axios";
import { translations } from "@/utils/translations";

const Navbar = () => {
  const user = useSelector(selectuser);
  const isLoading = useSelector(selectLoading);
  const currentLanguage = useSelector(selectLanguage);
  const dispatch = useDispatch();
  const router = useRouter();

  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const t = { ...translations["English"], ...((translations as any)[currentLanguage] || {}) };

  // 📱 Mobile Time Restriction Check (10 AM - 1 PM IST)
  const checkMobileTimeRestriction = (): boolean => {
    const { device } = getDeviceInfo();
    if (device.toLowerCase().includes("mobile")) {
      // Get IST time
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istTime = new Date(utc + (3600000 * 5.5));
      const hour = istTime.getHours();

      if (hour < 10 || hour >= 13) {
        toast.error("📱 Mobile login is allowed only between 10 AM – 1 PM IST.");
        return false; // Access denied
      }
    }
    return true; // Access allowed
  };

  const handleGoogleLogin = async () => {
    // Check mobile time restriction
    if (!checkMobileTimeRestriction()) {
      setIsLoginModalOpen(false);
      return;
    }

    setIsLoginModalOpen(false); // Close modal when starting Google auth
    // performFirebaseLogin handles everything including Chrome OTP check
    performFirebaseLogin();
  };

  const handleStandardLogin = async (identifier: string, pass: string, otpVerified = false) => {
    // Check mobile time restriction
    if (!checkMobileTimeRestriction()) {
      return;
    }

    try {
      const { browser, device, os } = getDeviceInfo();
      const res = await axios.post("https://internarea-wy7x.vercel.app/api/auth/login", {
        identifier,
        password: pass,
        device,
        browser,
        os,
        ip: "127.0.0.1",
        otpVerified
      });

      if (res.data.status === "SUCCESS") {
        dispatch(login(res.data.user));
        toast.success("Logged in successfully");
        setIsLoginModalOpen(false);
        setLoginPass("");
      } else if (res.data.status === "OTP_REQUIRED") {
        setOtpEmail(identifier);
        setLoginPass(pass);
        setOtpPurpose("LOGIN_CHROME_PASSWORD");
        setIsOTPModalOpen(true);

        try {
          await axios.post("https://internarea-wy7x.vercel.app/api/auth/send-otp", {
            identifier,
            purpose: "LOGIN_CHROME_PASSWORD"
          });
          toast.info(`OTP sent to ${identifier} (Chrome Security)`);
        } catch (err) {
          console.error(err);
          toast.error("Failed to send OTP");
        }
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Login Failed");
    }
  };

  const performFirebaseLogin = async () => {
    // Double-check mobile time restriction
    if (!checkMobileTimeRestriction()) {
      return;
    }

    try {
      const { setPersistence, browserLocalPersistence } = await import("firebase/auth");
      await setPersistence(auth, browserLocalPersistence);

      const { browser } = getDeviceInfo();

      // 🚨 If Chrome, set pending flag BEFORE Firebase auth to prevent AuthContext race
      if (browser === "Chrome" && typeof window !== 'undefined') {
        sessionStorage.setItem("chrome_otp_pending", "true");
      }

      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user?.email || "";

      // 🚨 CHROME SECURITY LOCK
      if (browser === "Chrome") {
        setOtpPurpose("LOGIN_CHROME_GOOGLE");
        setOtpEmail(userEmail);
        setIsOTPModalOpen(true);

        await axios.post("https://internarea-wy7x.vercel.app/api/auth/send-otp", {
          identifier: userEmail,
          purpose: "LOGIN_CHROME_GOOGLE"
        });
        toast.info(`OTP sent to ${userEmail}`);

        return; // ⛔ Stop here until OTP is verified
      }

      // Non-chrome → normal login
      await recordLogin(result.user);

    } catch (error) {
      console.error(error);
      toast.error("Google login failed");
    }
  };


  const recordLogin = async (firebaseUser: any) => {
    try {
      const { browser, device, os } = getDeviceInfo();
      const res = await axios.post("https://internarea-wy7x.vercel.app/api/auth/record-login", {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        device,
        browser,
        os,
        ip: "127.0.0.1",
        otpVerified: browser === "Chrome" ? true : false
      });

      if (res.data.status === "SUCCESS") {
        dispatch(login(res.data.user));
        toast.success("Logged in successfully");
      } else if (res.data.status === "OTP_REQUIRED") {
        return res.data;
      }
    } catch (error: any) {
      console.error(error);
      console.error(error);
      if (error.response?.status === 403 || error.response?.data?.status === "BLOCKED") {
        signOut(auth);
        toast.error(error.response?.data?.error || "Login restricted");
      } else {
        toast.warn("Session sync warning - check connection");
      }
    }
  };

  const updateLoginAfterOTP = async (firebaseUser: any) => {
    const { browser, device, os } = getDeviceInfo();
    try {
      const res = await axios.post("https://internarea-wy7x.vercel.app/api/auth/record-login", {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        device,
        browser,
        os,
        ip: "127.0.0.1",
        otpVerified: true
      });
      if (res.data.status === "SUCCESS") {
        dispatch(login(res.data.user));
        toast.success("Login Verified & Success");
      }
    } catch (e) {
      console.error(e);
      toast.error("Login Verification Failed");
    }
  };


  const handleOTPSuccess = async () => {
    if (otpPurpose === "LOGIN_CHROME_GOOGLE") {
      const user = auth.currentUser;
      if (!user) return;

      // Clear pending flag and set verified flag in both session and local storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem("chrome_otp_pending");
        sessionStorage.setItem("chrome_verified", "true");
        // Store in localStorage for persistence across page refreshes
        localStorage.setItem("chrome_verified_" + user.email, "true");
      }

      await recordLogin(user);   // Backend session starts ONLY now
    }

    if (otpPurpose === "LANGUAGE_FRENCH") {
      dispatch(setLanguage(targetLanguage));
      toast.success(`Language switched to ${targetLanguage}`);
    }

    if (otpPurpose === "LOGIN_CHROME_PASSWORD") {
      handleStandardLogin(otpEmail, loginPass, true);
    }
  };


  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    if (lang === "French") {
      if (!user) {
        toast.info("Please login to access French language");
        setIsLoginModalOpen(true);
        return;
      }
      setTargetLanguage("French");
      setOtpPurpose("LANGUAGE_FRENCH");

      const email = user?.email;
      setOtpEmail(email);
      setIsOTPModalOpen(true);

      // Trigger OTP send immediately
      axios.post("https://internarea-wy7x.vercel.app/api/auth/send-otp", {
        identifier: email,
        purpose: "LANGUAGE_FRENCH"
      })
        .then(() => toast.info(`OTP sent to ${email} for language verification`))
        .catch(err => {
          console.error(err);
          toast.error("Failed to send verification OTP");
        });

    } else {
      dispatch(setLanguage(lang));
      setTargetLanguage(""); // Reset target
    }
  };

  const handlelogout = () => {
    // Clear Chrome verification flags on logout (both session and local storage)
    if (typeof window !== 'undefined') {
      const currentUser = auth.currentUser;
      sessionStorage.removeItem("chrome_verified");
      sessionStorage.removeItem("chrome_otp_pending");
      // Also clear localStorage verification for this user
      if (currentUser?.email) {
        localStorage.removeItem("chrome_verified_" + currentUser.email);
      }
    }
    dispatch(logout());
    signOut(auth).then(() => {
      toast.success("Logged Out Successfully");
      router.push("/");
    }).catch((error) => {
      console.error("Logout Error:", error);
      toast.error("Logout Failed");
    });
  };

  return (
    <div className="relative">
      <OTPModal
        isOpen={isOTPModalOpen}
        onClose={() => {
          setIsOTPModalOpen(false);
          // Clear pending flag on cancel
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem("chrome_otp_pending");
          }
          // Sign out if Chrome login was cancelled
          if (otpPurpose === "LOGIN_CHROME_GOOGLE" || otpPurpose === "LOGIN_CHROME_PASSWORD") {
            signOut(auth);
          }
        }}
        email={otpEmail}
        onSuccess={handleOTPSuccess}
        purpose={otpPurpose}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onGoogleLogin={handleGoogleLogin}
        onStandardLogin={handleStandardLogin}
        onSignup={async (data) => {
          try {
            const res = await axios.post("https://internarea-wy7x.vercel.app/api/auth/register", data);
            if (res.data.status === "SUCCESS") {
              toast.success("Account created! Logging you in...");
              dispatch(login(res.data.user));
              setIsLoginModalOpen(false);
            }
          } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Registration Failed");
          }
        }}
        t={t}
      />

      <nav className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600 flex items-center">
                <button
                  className="mr-2 md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <img src={"/logo.png"} alt="" className="h-10 md:h-16 object-contain" />
              </Link>
            </div>

            {/* Mobile Login Button - Always visible on mobile */}
            <div className="flex md:hidden items-center space-x-2">
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center space-x-2">
                  <img
                    src={user.photo || "https://via.placeholder.com/40"}
                    alt=""
                    className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-blue-600 text-white rounded-lg px-3 py-1.5 flex items-center space-x-1 hover:bg-blue-700 transition-all text-sm font-medium shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  <span>{t.nav_login}</span>
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href={"/internship"} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">{t.nav_internships}</Link>
              <Link href={"/job"} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">{t.nav_jobs}</Link>
              <Link href={"/Subscription"} className="text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center gap-1">
                💎 {t.nav_subscription || "Plans"}
              </Link>

              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-200 transition-colors cursor-text">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder="Search..." className="ml-2 bg-transparent focus:outline-none text-sm w-32 lg:w-48 placeholder-gray-400" />
              </div>

              <div className="relative group">
                <div className="flex items-center space-x-1 border rounded-lg px-2 py-1 cursor-pointer hover:bg-gray-50">
                  <Globe size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700">{currentLanguage}</span>
                </div>
                <select
                  className="absolute inset-0 opacity-0 cursor-pointer text-black"
                  value={currentLanguage}
                  onChange={handleLanguageChange}
                >
                  <option value="English" className="text-black bg-white">English</option>
                  <option value="Spanish" className="text-black bg-white">Spanish</option>
                  <option value="Hindi" className="text-black bg-white">Hindi</option>
                  <option value="Portuguese" className="text-black bg-white">Portuguese</option>
                  <option value="Chinese" className="text-black bg-white">Chinese</option>
                  <option value="French" className="text-black bg-white">French (Locked)</option>
                </select>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {isLoading ? (
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <div className="relative group z-50">
                  <button className="flex items-center space-x-2 focus:outline-none py-2 hover:bg-gray-50 rounded-full px-2 transition-colors">
                    <img src={user.photo || "https://via.placeholder.com/40"} alt="" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                    <span className="font-medium text-gray-700 max-w-[100px] truncate">{user.name || "User"}</span>
                    <ChevronDown size={14} className="text-gray-500 transition-transform group-hover:rotate-180" />
                  </button>
                  <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-56 overflow-hidden ring-1 ring-black ring-opacity-5">
                      <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Signed in as</p>
                        <p className="text-sm font-bold text-gray-900 truncate" title={user.email}>{user.email}</p>
                      </div>
                      <Link href="/profile" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        {t.nav_profile}
                      </Link>
                      <Link href="/LoginHistory" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        {t.nav_history}
                      </Link>
                      <Link href="/Publicspace" className="block px-4 py-2.5 text-sm text-blue-600 font-semibold hover:bg-blue-50 transition-colors border-t border-gray-50">
                        🌐 {t.nav_public}
                      </Link>
                      <Link href="/Subscription" className="block px-4 py-2.5 text-sm text-yellow-600 font-semibold hover:bg-yellow-50 transition-colors">
                        💎 {t.nav_subscription || "Plans"}
                      </Link>
                      <Link href="/ResumeBuilder" className="block px-4 py-2.5 text-sm text-green-600 font-semibold hover:bg-green-50 transition-colors">
                        📄 {t.nav_resume || "Resume Builder"}
                      </Link>
                      <button
                        onClick={handlelogout}
                        className="w-full text-left block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50"
                      >
                        {t.nav_logout}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center space-x-2 hover:bg-gray-50 hover:shadow-sm transition-all text-sm font-medium"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  <span className="text-gray-700">{t.nav_login}</span>
                </button>
              )}
              <Link href="/adminlogin" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm border border-gray-300 px-3 py-2 rounded-lg bg-gray-50/50 hover:bg-gray-100">
                {t.nav_admin}
              </Link>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 pb-4 shadow-lg animate-slideDown">
            <div className="px-4 py-2 space-y-1">
              <Link href={"/internship"} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">{t.nav_internships}</Link>
              <Link href={"/job"} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">{t.nav_jobs}</Link>
              <Link href={"/Subscription"} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">💎 {t.nav_subscription || "Plans"}</Link>
              {user && (
                <Link href={"/Publicspace"} className="block px-3 py-2 rounded-md text-base font-bold text-blue-600 hover:bg-blue-50">{t.nav_public}</Link>
              )}
              <div className="border-t border-gray-100 my-2 pt-2">
                <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md">
                  <Search size={16} className="text-gray-400" />
                  <input type="text" placeholder="Search..." className="ml-2 bg-transparent focus:outline-none text-sm w-full" />
                </div>
              </div>
              {user ? (
                <div className="space-y-1 border-t border-gray-100 pt-2">
                  <Link href="/profile" className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50">{t.nav_profile}</Link>
                  <Link href="/LoginHistory" className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50">{t.nav_history}</Link>
                  <Link href="/ResumeBuilder" className="block px-3 py-2 rounded-md text-sm text-green-600 font-semibold hover:bg-green-50">📄 {t.nav_resume || "Resume Builder"}</Link>
                  <button onClick={handlelogout} className="w-full text-left block px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50">{t.nav_logout}</button>
                </div>
              ) : (
                <div className="space-y-2 border-t border-gray-100 pt-4 mt-2">
                  <Link
                    href="/adminlogin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 border border-transparent transition-colors"
                  >
                    {t.nav_admin}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;

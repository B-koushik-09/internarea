import Footer from "@/Components/Fotter";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch } from "react-redux";
import { useEffect } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout } from "@/Feature/Userslice";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from "@/context/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  // Removed internal AuthListener as it is replaced by AuthContext

  return (
    <Provider store={store}>
      <AuthProvider>
        {/* 🔒 Root wrapper prevents horizontal overflow (iPad Mini fix) */}
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white">
          <ToastContainer />
          <Navbar />
          <Component {...pageProps} />
          <Footer />
        </div>
      </AuthProvider>
    </Provider>
  );
}

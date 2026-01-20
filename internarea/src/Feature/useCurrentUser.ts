"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";

export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser?.email) {
        const res = await axios.get(
          `https://internarea-backend-kd6b.onrender.com/api/user-routes/by-email/${fbUser.email}`
        );
        setUser(res.data);
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  return user;
}

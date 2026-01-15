"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";

export function ClientAuth({ children }: { children: (user: any) => JSX.Element }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => setUser(fbUser));
    return () => unsub();
  }, []);

  return children(user);
}

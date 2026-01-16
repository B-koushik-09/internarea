"use client";
import { useState, useEffect, JSX } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase/firebase";

export function ClientAuth({ children }: { children: (user: User | null) => JSX.Element }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser: User | null) => setUser(fbUser));
    return () => unsub();
  }, []);

  return children(user);
}

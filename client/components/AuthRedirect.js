"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, clearToken, getToken } from "../lib/api.js";
import { PageLoader } from "./ui/PageLoader.js";

export default function AuthRedirect({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      const token = getToken();
      if (!token) {
        if (mounted) setChecking(false);
        return;
      }
      try {
        await api("/auth/me");
        router.replace("/dashboard");
      } catch {
        clearToken();
        if (mounted) setChecking(false);
      }
    }

    verifySession();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) return <PageLoader label="Checking session..." className="min-h-screen" />;
  return children;
}

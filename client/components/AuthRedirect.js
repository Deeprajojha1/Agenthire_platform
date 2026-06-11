"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken } from "../lib/api.js";
import { resolveSession } from "../lib/session.js";
import { PageLoader } from "./ui/PageLoader.js";

export default function AuthRedirect({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(() => Boolean(getToken()));

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      if (!getToken()) {
        if (mounted) setChecking(false);
        return;
      }
      const session = await resolveSession();
      if (session) {
        router.replace(session.redirectTo);
        return;
      }
      if (mounted) setChecking(false);
    }

    verifySession();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) return <PageLoader label="Checking session..." className="min-h-screen" />;
  return children;
}

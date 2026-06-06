"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resolveSession } from "../lib/session.js";
import { PageLoader } from "./ui/PageLoader.js";

export default function AuthRedirect({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
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

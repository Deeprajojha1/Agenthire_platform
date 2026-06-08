"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "../../../components/ui/PageLoader.js";
import { rememberAuthRole } from "../../../lib/authRole.js";

export default function CandidateSignupPage() {
  const router = useRouter();

  useEffect(() => {
    rememberAuthRole("candidate");
    router.replace("/signup");
  }, [router]);

  return <PageLoader label="Opening signup..." className="min-h-screen" />;
}

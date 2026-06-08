"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "../../../components/ui/PageLoader.js";
import { rememberAuthRole } from "../../../lib/authRole.js";

export default function CandidateLoginPage() {
  const router = useRouter();

  useEffect(() => {
    rememberAuthRole("candidate");
    router.replace("/login");
  }, [router]);

  return <PageLoader label="Opening login..." className="min-h-screen" />;
}

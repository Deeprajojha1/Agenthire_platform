"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "../lib/api.js";
import { Button } from "../components/ui/Button.js";

export default function Home() {
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => setHasToken(Boolean(getToken())), []);
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-xl rounded-md border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold">AgentHire</h1>
        <p className="mt-3 text-slate-600">Spec-driven recruiter console for candidate workflows, approvals, and analytics.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><Link href={hasToken ? "/dashboard" : "/login"}>{hasToken ? "Open Dashboard" : "Log In"}</Link></Button>
          <Button variant="outline" asChild><Link href="/signup">Sign Up</Link></Button>
        </div>
      </section>
    </main>
  );
}

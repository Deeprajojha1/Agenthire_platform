"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AuthShell from "../../../components/AuthShell.js";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { InlineLoader } from "../../../components/ui/PageLoader.js";
import { resolveSession } from "../../../lib/session.js";
import { useAuthStore } from "../../../store/authStore.js";

export default function CandidateLoginPage() {
  const router = useRouter();
  const candidateLogin = useAuthStore((state) => state.candidateLogin);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function redirectIfAuthenticated() {
      const session = await resolveSession();
      if (mounted && session) router.replace(session.redirectTo);
    }
    redirectIfAuthenticated();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await candidateLogin({
        email: String(form.get("email") || "").trim().toLowerCase(),
        password: String(form.get("password") || "")
      });
      toast.success("Welcome back");
      router.replace("/candidate/dashboard");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Track your applications with AgentHire."
      subtitle="See workflow progress, match scores, timelines, and application notifications in one place."
      footerText="New candidate?"
      footerHref="/candidate/signup"
      footerLabel="Create account"
    >
      <form method="post" onSubmit={submit}>
        <h2 className="text-2xl font-semibold text-slate-950">Candidate login</h2>
        <p className="mt-2 text-sm text-slate-600">Use the email connected to your applications.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <Input className="mt-2" name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <Input className="mt-2" name="password" type="password" placeholder="Enter your password" required />
          </label>
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button className="mt-6 w-full" disabled={loading}>{loading ? <InlineLoader label="Logging in..." /> : "Log In"}</Button>
      </form>
    </AuthShell>
  );
}

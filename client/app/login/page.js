"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import AuthRedirect from "../../components/AuthRedirect.js";
import AuthShell from "../../components/AuthShell.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { InlineLoader } from "../../components/ui/PageLoader.js";
import { useAuthStore } from "../../store/authStore.js";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      await login({ email: form.get("email"), password: form.get("password") });
      toast.success("Welcome back");
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthRedirect>
      <AuthShell
        title="Welcome back to your recruiter workspace."
        subtitle="Sign in to manage jobs, review candidates, approve AI workflow checkpoints, and inspect every workflow log."
        footerText="New to AgentHire?"
        footerHref="/signup"
        footerLabel="Create account"
      >
        <form method="post" onSubmit={submit}>
          <h2 className="text-2xl font-semibold text-slate-950">Log in</h2>
          <p className="mt-2 text-sm text-slate-600">Use your recruiter credentials to continue.</p>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Email address
              <Input className="mt-2" name="email" type="email" placeholder="you@company.com" required />
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
    </AuthRedirect>
  );
}

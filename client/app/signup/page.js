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

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((state) => state.signup);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      await signup({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
      toast.success("Recruiter account created");
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
        title="Create a recruiter account and start screening candidates."
        subtitle="Set up your secure workspace, create jobs, share public apply links, and let AgentHire run the application workflow."
        footerText="Already have an account?"
        footerHref="/login"
        footerLabel="Log in"
      >
        <form method="post" onSubmit={submit}>
          <h2 className="text-2xl font-semibold text-slate-950">Create account</h2>
          <p className="mt-2 text-sm text-slate-600">Your account will be created with recruiter access.</p>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <Input className="mt-2" name="name" placeholder="Your name" required />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email address
              <Input className="mt-2" name="email" type="email" placeholder="you@company.com" required />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <Input className="mt-2" name="password" type="password" placeholder="Minimum 8 characters" minLength={8} required />
            </label>
          </div>
          {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button className="mt-6 w-full" disabled={loading}>{loading ? <InlineLoader label="Creating account..." /> : "Create Account"}</Button>
        </form>
      </AuthShell>
    </AuthRedirect>
  );
}

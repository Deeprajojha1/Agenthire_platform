"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AuthRedirect from "../../components/AuthRedirect.js";
import AuthShell from "../../components/AuthShell.js";
import RoleToggle from "../../components/RoleToggle.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { InlineLoader } from "../../components/ui/PageLoader.js";
import { getAuthRoleFallback, rememberAuthRole } from "../../lib/authRole.js";
import { useAuthStore } from "../../store/authStore.js";

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((state) => state.signup);
  const candidateSignup = useAuthStore((state) => state.candidateSignup);
  const [role, setRole] = useState("recruiter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRole(getAuthRoleFallback());
  }, []);

  function changeRole(nextRole) {
    rememberAuthRole(nextRole);
    setRole(nextRole);
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const payload = {
        name: String(form.get("name") || "").trim(),
        email: String(form.get("email") || "").trim().toLowerCase(),
        password: String(form.get("password") || "")
      };
      if (role === "candidate") {
        await candidateSignup(payload);
        toast.success("Candidate account created");
        router.replace("/candidate/dashboard");
        return;
      }
      await signup(payload);
      toast.success("Recruiter account created");
      router.replace("/dashboard");
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
        title="Create your AgentHire account."
        subtitle="Pick recruiter or candidate access, add your credentials, and start on the right dashboard."
        footerText="Already have an account?"
        footerHref="/login"
        footerLabel="Log in"
      >
        <form method="post" onSubmit={submit}>
          <h2 className="text-2xl font-semibold text-slate-950">Create account</h2>
          <p className="mt-2 text-sm text-slate-600">Select the role you want before creating the account.</p>
          <div className="mt-6 space-y-4">
            <RoleToggle value={role} onChange={changeRole} />
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <Input className="mt-2" name="name" placeholder="Your name" required />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email address
              <Input className="mt-2" name="email" type="email" placeholder={role === "candidate" ? "you@example.com" : "you@company.com"} required />
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

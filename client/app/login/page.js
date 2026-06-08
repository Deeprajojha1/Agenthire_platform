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

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const candidateLogin = useAuthStore((state) => state.candidateLogin);
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
        email: String(form.get("email") || "").trim().toLowerCase(),
        password: String(form.get("password") || "")
      };
      if (role === "candidate") {
        await candidateLogin(payload);
        toast.success("Welcome back");
        router.replace("/candidate/dashboard");
        return;
      }
      await login(payload);
      toast.success("Welcome back");
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
        title="Welcome back to AgentHire."
        subtitle="Choose your role, sign in with your credentials, and continue to the dashboard made for that access."
        footerText="New to AgentHire?"
        footerHref="/signup"
        footerLabel="Create account"
      >
        <form method="post" onSubmit={submit}>
          <h2 className="text-2xl font-semibold text-slate-950">Log in</h2>
          <p className="mt-2 text-sm text-slate-600">Select your account type before entering credentials.</p>
          <div className="mt-6 space-y-4">
            <RoleToggle value={role} onChange={changeRole} />
            <label className="block text-sm font-medium text-slate-700">
              Email address
              <Input className="mt-2" name="email" type="email" placeholder={role === "candidate" ? "you@example.com" : "you@company.com"} required />
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

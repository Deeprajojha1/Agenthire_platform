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
        subtitle="Sign in with your credentials to access your recruiter or candidate dashboard."
        footerText="New to AgentHire?"
        footerHref="/signup"
        footerLabel="Create account"
      >
        <form method="post" onSubmit={submit}>
          <h2 className="text-2xl font-bold text-white mb-2">Sign in</h2>
          <p className="text-sm text-slate-400 mb-6">Select your role and enter your credentials</p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">Account type</label>
              <RoleToggle value={role} onChange={changeRole} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">
                Email address
              </label>
              <Input 
                className="w-full bg-slate-700/50 border border-slate-600/50 text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all rounded-lg px-4 py-2" 
                name="email" 
                type="email" 
                placeholder={role === "candidate" ? "you@example.com" : "you@company.com"} 
                required 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">
                Password
              </label>
              <Input 
                className="w-full bg-slate-700/50 border border-slate-600/50 text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all rounded-lg px-4 py-2" 
                name="password" 
                type="password" 
                placeholder="Enter your password" 
                required 
              />
            </div>
          </div>
          {error && (
            <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
          <button 
            disabled={loading}
            className="mt-6 w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {loading ? <InlineLoader label="Signing in..." /> : "Sign in"}
          </button>
        </form>
      </AuthShell>
    </AuthRedirect>
  );
}

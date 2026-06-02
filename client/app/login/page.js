"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { useAuthStore } from "../../store/authStore.js";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await login({ email: form.get("email"), password: form.get("password") });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Recruiter Login</h1>
        <div className="mt-6 space-y-3">
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Password" required />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <Button className="mt-5 w-full">Log In</Button>
        <Link href="/signup" className="mt-4 block text-center text-sm text-slate-600">Create account</Link>
      </form>
    </main>
  );
}

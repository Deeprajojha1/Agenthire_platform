"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { useAuthStore } from "../../store/authStore.js";

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((state) => state.signup);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await signup({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Create Recruiter Account</h1>
        <div className="mt-6 space-y-3">
          <Input name="name" placeholder="Name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Password" minLength={8} required />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <Button className="mt-5 w-full">Sign Up</Button>
        <Link href="/login" className="mt-4 block text-center text-sm text-slate-600">Already have an account?</Link>
      </form>
    </main>
  );
}

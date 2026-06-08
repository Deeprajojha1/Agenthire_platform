"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ApplicationForm from "../../../../components/jobs/ApplicationForm.js";
import { Button } from "../../../../components/ui/Button.js";

export default function ApplyPage() {
  const { jobId } = useParams();
  const router = useRouter();

  function handleSuccess() {
    window.setTimeout(() => {
      router.push("/candidate/jobs");
    }, 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f7] px-4 py-8">
      <section className="w-full max-w-xl">
        <Button type="button" variant="ghost" className="mb-4 px-2" onClick={() => router.back()}>
          <ArrowLeft size={17} /> Back
        </Button>
        <ApplicationForm jobId={jobId} onSuccess={handleSuccess} />
      </section>
    </main>
  );
}

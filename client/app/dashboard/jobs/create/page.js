"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { JobForm } from "../../../../components/jobs/JobForm.js";
import { api } from "../../../../lib/api.js";

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(payload) {
    setLoading(true);
    try {
      await api("/jobs", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      toast.success("Job created");
      router.push("/dashboard/jobs");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <JobForm loading={loading} onSubmit={submit} />;
}

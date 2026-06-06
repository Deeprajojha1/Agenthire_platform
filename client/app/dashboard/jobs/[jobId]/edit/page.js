"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { JobForm } from "../../../../../components/jobs/JobForm.js";
import { PageLoader } from "../../../../../components/ui/PageLoader.js";
import { api } from "../../../../../lib/api.js";

export default function EditJobPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api(`/jobs/${jobId}`)
      .then(setJob)
      .catch((error) => toast.error(error.message));
  }, [jobId]);

  async function submit(payload) {
    setLoading(true);
    try {
      await api(`/jobs/${jobId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      toast.success("Job updated");
      router.push("/dashboard/jobs");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!job) return <PageLoader label="Loading job..." />;

  return <JobForm initialJob={job} loading={loading} mode="edit" onSubmit={submit} />;
}

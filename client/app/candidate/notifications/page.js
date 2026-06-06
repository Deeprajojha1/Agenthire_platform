"use client";

import "@xyflow/react/dist/style.css";
import { Background, ReactFlow } from "@xyflow/react";
import { BriefcaseBusiness, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button.js";
import { PageLoader } from "../../../components/ui/PageLoader.js";
import { api } from "../../../lib/api.js";

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatNodeName(value) {
  return String(value || "").replaceAll("_", " ");
}

function WorkflowFlow({ workflow, nodeStateSpec }) {
  const states = workflow?.node_states || [];
  const pendingColor = nodeStateSpec?.pending?.color || "#64748b";
  const nodes = states.map((node, index) => {
    const color = nodeStateSpec?.[node.status]?.color || pendingColor;
    const timing = node.completed_at || node.started_at;
    return {
      id: node.name,
      position: { x: index * 210, y: index % 2 === 0 ? 30 : 135 },
      data: {
        label: (
          <div className="text-left">
            <p className="text-xs font-semibold capitalize text-slate-950">{formatNodeName(node.name)}</p>
            <p className="mt-1 text-[11px] capitalize" style={{ color }}>{formatNodeName(node.status)}</p>
            <p className="mt-1 text-[10px] text-slate-500">{formatDate(timing)}</p>
          </div>
        )
      },
      style: {
        border: `2px solid ${color}`,
        borderRadius: 8,
        width: 170,
        padding: 10,
        background: "#fff"
      }
    };
  });
  const edges = states.slice(0, -1).map((node, index) => ({
    id: `${node.name}-${states[index + 1].name}`,
    source: node.name,
    target: states[index + 1].name,
    animated: states[index + 1].status === "running",
    style: { stroke: "#0f766e" }
  }));

  if (!states.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-sm text-slate-500">
        Workflow will appear after the application starts processing.
      </div>
    );
  }

  return (
    <div className="h-72 rounded-md border border-slate-200 bg-white">
      <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}>
        <Background />
      </ReactFlow>
    </div>
  );
}

export default function CandidateNotificationsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [activeApplicationId, setActiveApplicationId] = useState("");

  async function load() {
    try {
      const nextData = await api("/candidate/notifications");
      setData(nextData);
      setActiveApplicationId((current) => current || nextData.applications?.[0]?.application?.id || "");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAllRead() {
    await api("/candidate/notifications/read-all", { method: "PATCH" });
    toast.success("Notifications marked as read");
    load();
  }

  const activeApplication = data?.applications?.find((item) => String(item.application.id) === String(activeApplicationId)) || data?.applications?.[0];

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Notification Center</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Notifications</h1>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={!data?.unread_count}><CheckCheck size={16} />Mark all as read</Button>
      </div>

      {!data && !error && <PageLoader label="Loading notifications..." className="min-h-80" />}
      {error && <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="mt-6 space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium text-teal-700">Application Workflow</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  {activeApplication?.application?.job?.title || "No application selected"}
                </h2>
                {activeApplication && (
                  <p className="mt-1 text-sm text-slate-600">
                    Submitted for {activeApplication.application.job?.title || "selected role"} on {formatDate(activeApplication.application.applied_at)}
                  </p>
                )}
              </div>
              {data.applications?.length > 0 && (
                <select
                  value={activeApplication?.application?.id || ""}
                  onChange={(event) => setActiveApplicationId(event.target.value)}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                >
                  {data.applications.map((item) => (
                    <option key={item.application.id} value={item.application.id}>
                      {item.application.job?.title || "Application"} - {formatDate(item.application.applied_at)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {activeApplication && (
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
                <WorkflowFlow workflow={activeApplication.workflow} nodeStateSpec={data.node_state_spec} />
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <BriefcaseBusiness size={16} /> {activeApplication.application.job?.title || "Application"}
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">Current Status</p>
                      <p className="mt-1 font-semibold capitalize text-slate-950">{activeApplication.application.status}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">Workflow</p>
                      <p className="mt-1 font-semibold capitalize text-slate-950">{activeApplication.application.workflow_status}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">Applied At</p>
                      <p className="mt-1 font-semibold text-slate-950">{formatDate(activeApplication.application.applied_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeApplication?.timeline?.length > 0 && (
              <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-950">Timing Timeline</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {activeApplication.timeline.map((item) => (
                    <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                      <p className="font-semibold capitalize text-slate-950">{formatNodeName(item.event)}</p>
                      <p className="mt-1 text-xs capitalize text-slate-500">{formatNodeName(item.status)} - {formatDate(item.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>
      )}
    </>
  );
}

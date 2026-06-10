"use client";

import "@xyflow/react/dist/style.css";
import { Background, Controls, MarkerType, MiniMap, ReactFlow } from "@xyflow/react";

function prettyState(value) {
  return String(value || "pending").replaceAll("_", " ");
}

export default function WorkflowGraph({ workflow, nodeStateSpec = {} }) {
  const states = workflow?.node_states || [];
  const pendingColor = nodeStateSpec.pending?.color || "#64748b";
  const currentState = workflow?.current_state;

  if (!states.length) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Workflow steps will appear here after the workflow starts.
      </div>
    );
  }

  const nodes = states.map((node, index) => ({
    id: node.name,
    position: { x: (index % 3) * 260, y: Math.floor(index / 3) * 150 },
    data: {
      label: (
        <div className="leading-tight">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Step {index + 1}</p>
          <p className="mt-1 text-sm font-semibold capitalize text-slate-950">{prettyState(node.name)}</p>
          <p className="mt-1 text-xs capitalize text-slate-600">{prettyState(node.status)}</p>
        </div>
      )
    },
    style: {
      border: `${node.name === currentState ? 3 : 2}px solid ${nodeStateSpec[node.status]?.color || pendingColor}`,
      borderRadius: 8,
      boxShadow: node.name === currentState ? "0 8px 24px rgba(20, 184, 166, 0.18)" : "0 1px 2px rgba(15, 23, 42, 0.08)",
      width: 210,
      padding: 12,
      background: "#ffffff"
    }
  }));
  const edges = states.slice(0, -1).map((node, index) => ({
    id: `${node.name}-${states[index + 1].name}`,
    source: node.name,
    target: states[index + 1].name,
    animated: states[index + 1].name === currentState,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: nodeStateSpec[states[index + 1].status]?.color || pendingColor, strokeWidth: 2 }
  }));

  return (
    <div className="h-[420px] overflow-hidden rounded-md border border-slate-200 bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.35}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="#cbd5e1" gap={18} />
        <MiniMap nodeStrokeWidth={3} pannable zoomable />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

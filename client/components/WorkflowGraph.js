"use client";

import "@xyflow/react/dist/style.css";
import { Background, ReactFlow } from "@xyflow/react";

export default function WorkflowGraph({ workflow, nodeStateSpec = {} }) {
  const states = workflow?.node_states || [];
  const pendingColor = nodeStateSpec.pending?.color || "#64748b";
  const nodes = states.map((node, index) => ({
    id: node.name,
    position: { x: (index % 4) * 220, y: Math.floor(index / 4) * 130 },
    data: { label: `${index + 1}. ${node.name.replaceAll("_", " ")}` },
    style: {
      border: `2px solid ${nodeStateSpec[node.status]?.color || pendingColor}`,
      color: nodeStateSpec[node.status]?.color || pendingColor,
      width: 180,
      fontSize: 12
    }
  }));
  const edges = states.slice(0, -1).map((node, index) => ({
    id: `${node.name}-${states[index + 1].name}`,
    source: node.name,
    target: states[index + 1].name
  }));
  return (
    <div className="h-80 rounded-md border border-slate-200 bg-white">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
      </ReactFlow>
    </div>
  );
}

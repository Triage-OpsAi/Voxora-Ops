"use client";

import { DragEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import {
  Bot,
  BrainCircuit,
  Building2,
  Copy,
  Diamond,
  Flag,
  Globe2,
  PhoneCall,
  Play,
  Plus,
  Power,
  Save,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { COUNTRY_CODE_OPTIONS, DEFAULT_COUNTRY_CODE, countryOptionFor, formatPhoneNumber, normalizePhoneNumber, splitPhoneNumber } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthUser, WorkflowDraft, WorkflowEdge, WorkflowNode, WorkflowNodeStatus, WorkflowRunLog } from "@/types";

type BuilderNodeKind =
  | "start_trigger"
  | "http_api"
  | "ai_agent"
  | "business_details"
  | "call_voice"
  | "lead_capture"
  | "condition"
  | "end";

type BuilderNodeData = {
  kind: BuilderNodeKind;
  label: string;
  description: string;
  config: Record<string, string>;
  status: WorkflowNodeStatus;
} & Record<string, unknown>;

type BuilderNode = Node<BuilderNodeData, "workflowNode">;
type BuilderEdge = Edge<{ output: string }>;
type PreviousNodeGroup = { node: BuilderNode; fields: OutputField[] };

type NodeConfigField = {
  key: string;
  label: string;
  placeholder?: string;
  kind?: "text" | "textarea" | "select" | "phone";
  options?: string[];
};

type OutputField = {
  key: string;
  label: string;
  type: string;
  description?: string;
};

type NodeDefinition = {
  kind: BuilderNodeKind;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Bot;
  color: string;
  minimapColor: string;
  outputs: string[];
  outputSchema: OutputField[];
  fields: NodeConfigField[];
};

const WORKFLOW_KEY = "voxora.workflow.canvas.v1";
const NODE_WIDTH = 220;
const NODE_HEIGHT = 92;

const NODE_DEFINITIONS: Record<BuilderNodeKind, NodeDefinition> = {
  start_trigger: {
    kind: "start_trigger",
    label: "Start",
    shortLabel: "Start",
    description: "Optional entry point. A workflow can also begin from any node.",
    icon: Play,
    color: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
    minimapColor: "#34d399",
    outputs: ["start"],
    outputSchema: [
      { key: "event", label: "event", type: "string" },
      { key: "timestamp", label: "timestamp", type: "datetime" },
      { key: "payload", label: "payload", type: "object" },
    ],
    fields: [{ key: "event", label: "Trigger event", placeholder: "New lead created" }],
  },
  http_api: {
    kind: "http_api",
    label: "HTTP / API",
    shortLabel: "API",
    description: "Call an API and expose its response fields to connected nodes.",
    icon: Globe2,
    color: "border-blue-400/35 bg-blue-400/10 text-blue-200",
    minimapColor: "#60a5fa",
    outputs: ["response"],
    outputSchema: [],
    fields: [
      { key: "url", label: "URL", placeholder: "https://api.example.com/leads" },
      { key: "method", label: "Method", kind: "select", options: ["GET", "POST", "PUT", "PATCH"] },
      { key: "responseSchema", label: "Response schema", placeholder: '{ "name": "string", "phone": "string", "email": "string" }', kind: "textarea" },
    ],
  },
  ai_agent: {
    kind: "ai_agent",
    label: "AI Agent",
    shortLabel: "AI Agent",
    description: "Reason over context, summarize, classify, or decide the next action.",
    icon: BrainCircuit,
    color: "border-fuchsia-400/35 bg-fuchsia-400/10 text-fuchsia-200",
    minimapColor: "#e879f9",
    outputs: ["result"],
    outputSchema: [
      { key: "response", label: "response", type: "string" },
      { key: "structuredJson", label: "structuredJson", type: "object" },
      { key: "confidence", label: "confidence", type: "number" },
      { key: "nextAction", label: "nextAction", type: "string" },
    ],
    fields: [
      { key: "task", label: "Task", kind: "select", options: ["Summarize", "Classify", "Extract", "Decide"] },
      { key: "prompt", label: "Prompt", placeholder: "Use the lead and call context to decide the next step.", kind: "textarea" },
    ],
  },
  business_details: {
    kind: "business_details",
    label: "Business Details",
    shortLabel: "Business",
    description: "Inject company context, offer, policies, hours, and tone.",
    icon: Building2,
    color: "border-sky-400/35 bg-sky-400/10 text-sky-200",
    minimapColor: "#38bdf8",
    outputs: ["context"],
    outputSchema: [
      { key: "businessName", label: "businessName", type: "string" },
      { key: "details", label: "details", type: "string" },
      { key: "services", label: "services", type: "array" },
      { key: "hours", label: "hours", type: "string" },
    ],
    fields: [
      { key: "businessName", label: "Business name", placeholder: "Acme Services" },
      { key: "details", label: "Details", placeholder: "Hours, offers, process, FAQs.", kind: "textarea" },
    ],
  },
  call_voice: {
    kind: "call_voice",
    label: "Call / Voice",
    shortLabel: "Voice",
    description: "Use the existing voice agent to place or handle a call.",
    icon: PhoneCall,
    color: "border-violet-400/35 bg-violet-400/10 text-violet-200",
    minimapColor: "#a78bfa",
    outputs: ["completed", "failed"],
    outputSchema: [
      { key: "callStatus", label: "callStatus", type: "string" },
      { key: "transcript", label: "transcript", type: "string" },
      { key: "summary", label: "summary", type: "string" },
      { key: "name", label: "name", type: "string" },
      { key: "phone", label: "phone", type: "string" },
      { key: "email", label: "email", type: "string" },
      { key: "bookingStatus", label: "bookingStatus", type: "string" },
      { key: "bookingConfirmed", label: "bookingConfirmed", type: "boolean" },
      { key: "structuredResponse", label: "structuredResponse", type: "object" },
    ],
    fields: [
      { key: "phoneNumber", label: "Phone number", placeholder: "8055678283", kind: "phone" },
      { key: "goal", label: "Call goal", placeholder: "Qualify the lead and capture appointment intent.", kind: "textarea" },
    ],
  },
  lead_capture: {
    kind: "lead_capture",
    label: "Lead Capture",
    shortLabel: "Lead",
    description: "Read or write lead fields for the workflow.",
    icon: UserPlus,
    color: "border-cyan-400/35 bg-cyan-400/10 text-cyan-200",
    minimapColor: "#22d3ee",
    outputs: ["lead"],
    outputSchema: [
      { key: "name", label: "name", type: "string" },
      { key: "phone", label: "phone", type: "string" },
      { key: "email", label: "email", type: "string" },
      { key: "status", label: "status", type: "string" },
      { key: "score", label: "score", type: "number" },
    ],
    fields: [
      { key: "name", label: "Name", placeholder: "{{previousNode.name}}" },
      { key: "phone", label: "Phone", placeholder: "{{previousNode.phone}}" },
      { key: "email", label: "Email", placeholder: "{{previousNode.email}}" },
      { key: "source", label: "Lead source", placeholder: "CRM, form, imported CSV" },
    ],
  },
  condition: {
    kind: "condition",
    label: "Condition",
    shortLabel: "If",
    description: "Branch the workflow based on structured data.",
    icon: Diamond,
    color: "border-amber-400/35 bg-amber-400/10 text-amber-200",
    minimapColor: "#fbbf24",
    outputs: ["true", "false"],
    outputSchema: [
      { key: "result", label: "result", type: "boolean" },
      { key: "branch", label: "branch", type: "string" },
      { key: "matchedValue", label: "matchedValue", type: "string" },
    ],
    fields: [
      { key: "left", label: "Value", placeholder: "{{previousNode.bookingStatus}}" },
      { key: "operator", label: "Operator", kind: "select", options: ["equals", "contains", "greater than", "less than"] },
      { key: "right", label: "Compare with", placeholder: "book_confirmed" },
    ],
  },
  end: {
    kind: "end",
    label: "End",
    shortLabel: "End",
    description: "Complete the workflow.",
    icon: Flag,
    color: "border-rose-400/35 bg-rose-400/10 text-rose-200",
    minimapColor: "#fb7185",
    outputs: [],
    outputSchema: [
      { key: "result", label: "result", type: "string" },
      { key: "completedAt", label: "completedAt", type: "datetime" },
    ],
    fields: [{ key: "result", label: "Result label", placeholder: "Workflow completed" }],
  },
};

const TOOLBAR_NODES: BuilderNodeKind[] = [
  "http_api",
  "ai_agent",
  "business_details",
  "call_voice",
  "lead_capture",
  "condition",
  "end",
];

const DEFAULT_WORKFLOW: WorkflowDraft = {
  id: "workflow-default",
  name: "Call confirmation flow",
  active: false,
  updatedAt: "2026-01-01T00:00:00.000Z",
  nodes: [
    createWorkflowNode("call_voice", { x: 120, y: 260 }, "voice-default", {
      phoneNumber: "",
      goal: "Call the customer and confirm whether the booking is confirmed.",
    }, "Trigger Call"),
    createWorkflowNode("condition", { x: 430, y: 260 }, "condition-default", {
      left: "{{previousNode.bookingStatus}}",
      operator: "equals",
      right: "book_confirmed",
    }, "Booking confirmed?"),
    createWorkflowNode("lead_capture", { x: 740, y: 130 }, "lead-default", {
      name: "{{voice-default.name}}",
      phone: "{{voice-default.phone}}",
      email: "{{voice-default.email}}",
      source: "Confirmed booking call",
    }, "Save Confirmed Booking"),
    createWorkflowNode("end", { x: 1040, y: 130 }, "confirmed-end-default", {
      result: "Booking confirmed",
    }, "Confirmed"),
    createWorkflowNode("end", { x: 740, y: 390 }, "not-confirmed-end-default", {
      result: "Booking not confirmed",
    }, "Not Confirmed"),
  ],
  edges: [
    { id: "edge-voice-condition", source: "voice-default", target: "condition-default", output: "completed" },
    { id: "edge-condition-lead", source: "condition-default", target: "lead-default", output: "true" },
    { id: "edge-lead-confirmed", source: "lead-default", target: "confirmed-end-default", output: "lead" },
    { id: "edge-condition-not-confirmed", source: "condition-default", target: "not-confirmed-end-default", output: "false" },
  ],
};

export function AgentsView() {
  return (
    <ReactFlowProvider>
      <AgentsCanvas />
    </ReactFlowProvider>
  );
}

function AgentsCanvas() {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: savedWorkflows, isLoading } = useQuery({ queryKey: ["workflows"], queryFn: api.workflows });
  const [workflowId, setWorkflowId] = useState(DEFAULT_WORKFLOW.id);
  const [workflowName, setWorkflowName] = useState(DEFAULT_WORKFLOW.name);
  const [activeWorkflow, setActiveWorkflow] = useState(DEFAULT_WORKFLOW.active);
  const [availableWorkflows, setAvailableWorkflows] = useState<WorkflowDraft[]>([DEFAULT_WORKFLOW]);
  const [nodes, setNodes, onNodesChange] = useNodesState<BuilderNode>(workflowToFlowNodes(DEFAULT_WORKFLOW));
  const [edges, setEdges, onEdgesChange] = useEdgesState<BuilderEdge>(workflowToFlowEdges(DEFAULT_WORKFLOW));
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [statusText, setStatusText] = useState("Ready");
  const [runLogs, setRunLogs] = useState<WorkflowRunLog[]>([]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const previousNodeGroups = selectedNode ? getPreviousNodeGroups(selectedNode, nodes, edges) : [];
  const nodeTypes = useMemo<NodeTypes>(() => ({ workflowNode: WorkflowCanvasNode }), []);

  const applyWorkflow = useCallback((workflow: WorkflowDraft) => {
    const normalized = normalizeWorkflow(workflow);
    setWorkflowId(normalized.id);
    setWorkflowName(normalized.name);
    setActiveWorkflow(normalized.active);
    setNodes(workflowToFlowNodes(normalized));
    setEdges(workflowToFlowEdges(normalized));
    setSelectedNodeId("");
    setRunLogs([]);
    window.requestAnimationFrame(() => fitView({ padding: 0.22, duration: 250 }));
  }, [fitView, setEdges, setNodes]);

  useEffect(() => {
    const saved = savedWorkflows?.map(normalizeWorkflow) || [];
    const list = [DEFAULT_WORKFLOW, ...saved.filter((workflow) => workflow.id !== DEFAULT_WORKFLOW.id)];
    setAvailableWorkflows(list);
    applyWorkflow(DEFAULT_WORKFLOW);
  }, [applyWorkflow, savedWorkflows]);

  function currentWorkflow(): WorkflowDraft {
    return {
      id: workflowId,
      name: workflowName.trim() || "Untitled workflow",
      active: activeWorkflow,
      updatedAt: new Date().toISOString(),
      nodes: nodes.map(flowNodeToWorkflowNode),
      edges: edges.map(flowEdgeToWorkflowEdge),
    };
  }

  function updateWorkflowList(workflow: WorkflowDraft) {
    setAvailableWorkflows((current) => {
      const exists = current.some((item) => item.id === workflow.id);
      return exists ? current.map((item) => item.id === workflow.id ? workflow : item) : [workflow, ...current];
    });
  }

  async function saveWorkflow() {
    const draft = currentWorkflow();
    setStatusText("Saving...");
    saveLocalWorkflow(draft);
    try {
      const saved = await api.saveWorkflow(draft);
      const normalized = normalizeWorkflow(saved);
      updateWorkflowList(normalized);
      setWorkflowId(normalized.id);
      setStatusText("Saved");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Saved locally");
    }
  }

  async function createNewWorkflow() {
    const draft: WorkflowDraft = {
      ...DEFAULT_WORKFLOW,
      id: makeId("workflow"),
      name: "Untitled workflow",
      active: false,
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
    };
    applyWorkflow(draft);
    updateWorkflowList(draft);
    saveLocalWorkflow(draft);
    try {
      const saved = await api.createWorkflow(draft);
      applyWorkflow(saved);
      updateWorkflowList(saved);
      setStatusText("Created");
    } catch {
      setStatusText("Created locally");
    }
  }

  async function duplicateWorkflow() {
    const draft = currentWorkflow();
    await saveWorkflow();
    setStatusText("Duplicating...");
    try {
      const duplicated = await api.duplicateWorkflow(draft.id);
      applyWorkflow(duplicated);
      updateWorkflowList(duplicated);
      setStatusText("Duplicated");
    } catch {
      const localCopy = {
        ...draft,
        id: makeId("workflow"),
        name: `${draft.name} copy`,
        active: false,
        nodes: draft.nodes.map((node, index) => ({ ...node, id: makeId(node.type), x: node.x + 60, y: node.y + 60 + index * 8 })),
        edges: [],
      };
      applyWorkflow(localCopy);
      updateWorkflowList(localCopy);
      setStatusText("Duplicated locally");
    }
  }

  async function activateWorkflow() {
    const draft = currentWorkflow();
    setStatusText("Activating...");
    try {
      await api.saveWorkflow(draft);
      const activated = await api.activateWorkflow(draft.id);
      setActiveWorkflow(true);
      updateWorkflowList(activated);
      setStatusText("Active");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Could not activate");
    }
  }

  async function runWorkflow() {
    const draft = currentWorkflow();
    setStatusText("Running...");
    setNodes((current) => current.map((node) => ({ ...node, data: { ...node.data, status: "running" } })));
    try {
      const saved = await api.saveWorkflow(draft);
      const voiceLogs = await runVoiceCalls(draft, user);
      const hasVoiceErrors = voiceLogs.some((log) => log.status === "error");
      const run = hasVoiceErrors ? null : await api.runWorkflow(saved.id);
      const logs = [...voiceLogs, ...(run?.logs || [])];
      const successfulNodes = new Set(logs.filter((log) => log.status === "success").map((log) => log.nodeId));
      const failedNodes = new Set(logs.filter((log) => log.status === "error").map((log) => log.nodeId));
      setNodes((current) => current.map((node) => ({
        ...node,
        data: { ...node.data, status: failedNodes.has(node.id) ? "error" : successfulNodes.has(node.id) ? "success" : "idle" },
      })));
      setRunLogs(logs);
      queryClient.invalidateQueries();
      setStatusText(hasVoiceErrors ? "Fix call node" : voiceLogs.length ? "Call queued" : `Run ${run?.status || "complete"}`);
    } catch (error) {
      setNodes((current) => current.map((node) => ({ ...node, data: { ...node.data, status: "idle" } })));
      setStatusText(error instanceof Error ? error.message : "Could not run");
    }
  }

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const output = connection.sourceHandle || "out";
    const sourceNode = nodes.find((node) => node.id === connection.source);
    setEdges((current) => addEdge({
      ...connection,
      id: makeId("edge"),
      sourceHandle: output,
      type: "smoothstep",
      animated: true,
      label: edgeOutputLabel(sourceNode?.data.kind, output),
      labelStyle: { fill: "#d4d4d8", fontSize: 11, fontWeight: 600 },
      labelBgStyle: { fill: "#10141d", fillOpacity: 0.92 },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 8,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6" },
      style: { stroke: "#8b5cf6", strokeWidth: 2 },
      data: { output },
    }, current));
  }, [nodes, setEdges]);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData("application/voxora-flow-node") as BuilderNodeKind;
    if (!NODE_DEFINITIONS[kind]) return;
    const position = findOpenPosition(screenToFlowPosition({ x: event.clientX, y: event.clientY }), nodes);
    const workflowNode = createWorkflowNode(kind, position);
    setNodes((current) => [...current, workflowNodeToFlowNode(workflowNode)]);
    setSelectedNodeId(workflowNode.id);
  }, [nodes, screenToFlowPosition, setNodes]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  function deleteSelectedNode() {
    if (!selectedNodeId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
    setEdges((current) => current.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
    setSelectedNodeId("");
  }

  function updateSelectedNode(config: Record<string, string>, label: string) {
    if (!selectedNode) return;
    setNodes((current) => current.map((node) => node.id === selectedNode.id ? {
      ...node,
      data: { ...node.data, label, config },
    } : node));
  }

  return (
    <div className="-m-4 h-[calc(100vh-4rem)] overflow-hidden bg-[#07090d] md:-m-7 lg:-m-8">
      <div className="relative h-full w-full">
        <TopToolbar
          workflows={availableWorkflows}
          workflowId={workflowId}
          workflowName={workflowName}
          active={activeWorkflow}
          loading={isLoading}
          statusText={statusText}
          onWorkflowNameChange={setWorkflowName}
          onWorkflowChange={(nextId) => {
            const next = availableWorkflows.find((item) => item.id === nextId);
            if (next) applyWorkflow(next);
          }}
          onNew={createNewWorkflow}
          onSave={saveWorkflow}
          onDuplicate={duplicateWorkflow}
          onRun={runWorkflow}
          onActivate={activateWorkflow}
        />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId("")}
          fitView
          fitViewOptions={{ padding: 0.24 }}
          minZoom={0.35}
          maxZoom={1.6}
          panOnScroll
          selectionOnDrag
          snapToGrid
          snapGrid={[16, 16]}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6" },
            style: { stroke: "#8b5cf6", strokeWidth: 2 },
          }}
          className="voxora-flow"
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="rgba(255,255,255,.18)" />
          <Controls className="voxora-flow-controls" showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            className="voxora-flow-minimap"
            nodeColor={(node) => NODE_DEFINITIONS[(node.data as BuilderNodeData).kind]?.minimapColor || "#71717a"}
          />
        </ReactFlow>

        {selectedNode && (
          <NodeSettingsPanel
            node={selectedNode}
            previousGroups={previousNodeGroups}
            onClose={() => setSelectedNodeId("")}
            onDelete={deleteSelectedNode}
            onUpdate={updateSelectedNode}
          />
        )}

        {runLogs.length > 0 && <RunLogBar logs={runLogs} onClose={() => setRunLogs([])} />}
      </div>
    </div>
  );
}

function TopToolbar({
  workflows,
  workflowId,
  workflowName,
  active,
  loading,
  statusText,
  onWorkflowNameChange,
  onWorkflowChange,
  onNew,
  onSave,
  onDuplicate,
  onRun,
  onActivate,
}: {
  workflows: WorkflowDraft[];
  workflowId: string;
  workflowName: string;
  active: boolean;
  loading: boolean;
  statusText: string;
  onWorkflowNameChange: (value: string) => void;
  onWorkflowChange: (value: string) => void;
  onNew: () => void;
  onSave: () => void;
  onDuplicate: () => void;
  onRun: () => void;
  onActivate: () => void;
}) {
  return (
    <div className="pointer-events-none absolute left-4 right-4 top-4 z-20 flex flex-wrap items-start justify-between gap-3">
      <div className="pointer-events-auto rounded-xl border border-white/[.08] bg-[#0c1018]/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={workflowId}
            onChange={(event) => onWorkflowChange(event.target.value)}
            className="h-9 max-w-48 rounded-lg border border-white/[.08] bg-black/25 px-2 text-xs text-zinc-200 outline-none"
          >
            {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
          </select>
          <input
            value={workflowName}
            onChange={(event) => onWorkflowNameChange(event.target.value)}
            className="h-9 w-52 rounded-lg border border-white/[.08] bg-black/25 px-3 text-sm font-medium text-white outline-none placeholder:text-zinc-600"
          />
          <ToolbarButton label="New" icon={<Plus size={14} />} onClick={onNew} />
          <ToolbarButton label="Save" icon={<Save size={14} />} onClick={onSave} />
          <ToolbarButton label="Copy" icon={<Copy size={14} />} onClick={onDuplicate} />
          <ToolbarButton label="Run" icon={<Play size={14} />} onClick={onRun} strong />
          <ToolbarButton label={active ? "Active" : "Activate"} icon={<Power size={14} />} onClick={onActivate} active={active} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {TOOLBAR_NODES.map((kind) => <ToolbarNode key={kind} definition={NODE_DEFINITIONS[kind]} />)}
        </div>
      </div>

      <div className="pointer-events-auto rounded-xl border border-white/[.08] bg-[#0c1018]/95 px-3 py-2 text-xs text-zinc-400 shadow-2xl shadow-black/30 backdrop-blur-xl">
        {loading ? "Loading..." : statusText}
      </div>
    </div>
  );
}

function ToolbarNode({ definition }: { definition: NodeDefinition }) {
  const Icon = definition.icon;
  return (
    <button
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("application/voxora-flow-node", definition.kind);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[.08] bg-white/[.04] px-3 text-xs font-medium text-zinc-200 transition hover:border-violet-400/40 hover:bg-white/[.07]"
      title={definition.description}
    >
      <Icon size={14} />
      {definition.shortLabel}
    </button>
  );
}

function ToolbarButton({ label, icon, onClick, strong, active }: { label: string; icon: React.ReactNode; onClick: () => void; strong?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition",
        strong && "border-violet-400/30 bg-violet-400/15 text-violet-100 hover:bg-violet-400/20",
        active && "border-emerald-400/30 bg-emerald-400/15 text-emerald-100",
        !strong && !active && "border-white/[.08] bg-white/[.04] text-zinc-200 hover:bg-white/[.07]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function WorkflowCanvasNode({ data, selected }: NodeProps<BuilderNode>) {
  const definition = NODE_DEFINITIONS[data.kind];
  const Icon = definition.icon;
  const statusTone = data.status === "success" ? "bg-emerald-400" : data.status === "running" ? "bg-violet-400" : data.status === "error" ? "bg-rose-400" : "bg-zinc-600";

  return (
    <div className={cn(
      "w-[220px] rounded-xl border bg-[#111620] p-3 text-zinc-100 shadow-[0_18px_60px_-34px_rgba(0,0,0,.95)] transition",
      selected ? "border-violet-300/80 ring-4 ring-violet-400/15" : "border-white/[.1]",
    )}>
      {data.kind !== "start_trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!size-3 !border-2 !border-[#111620] !bg-sky-300"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg border", definition.color)}>
          <Icon size={17} />
        </span>
        <span className="flex items-center gap-1.5 text-[10px] capitalize text-zinc-500">
          <span className={cn("size-1.5 rounded-full", statusTone)} />
          {data.status}
        </span>
      </div>
      <div className="mt-3 truncate text-sm font-semibold text-white">{data.label}</div>
      <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-500">{definition.description}</div>

      {definition.outputs.map((output, index) => (
        <Handle
          key={output}
          id={output}
          type="source"
          position={Position.Right}
          className="!size-3 !border-2 !border-[#111620] !bg-violet-300"
          style={{ top: `${38 + index * 24}px` }}
        />
      ))}
    </div>
  );
}

function NodeSettingsPanel({
  node,
  previousGroups,
  onClose,
  onDelete,
  onUpdate,
}: {
  node: BuilderNode;
  previousGroups: PreviousNodeGroup[];
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (config: Record<string, string>, label: string) => void;
}) {
  const definition = NODE_DEFINITIONS[node.data.kind];
  const [activeField, setActiveField] = useState(definition.fields[0]?.key || "");

  useEffect(() => {
    setActiveField(definition.fields[0]?.key || "");
  }, [definition.fields, node.id]);

  function updateConfig(key: string, value: string) {
    onUpdate({ ...node.data.config, [key]: value }, node.data.label);
  }

  function setMapping(expression: string, targetKey = activeField) {
    if (!targetKey) return;
    updateConfig(targetKey, expression);
  }

  return (
    <div className="absolute bottom-5 right-5 top-32 z-20 flex w-[390px] flex-col rounded-2xl border border-white/[.08] bg-[#0c1018]/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 border-b border-white/[.08] p-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[.18em] text-zinc-600">Node settings</div>
          <h2 className="mt-1 truncate text-base font-semibold text-white">{definition.label}</h2>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{definition.description}</p>
        </div>
        <button onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-white/[.06] hover:text-white" aria-label="Close node settings">
          <X size={15} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <label className="space-y-2">
            <span className="text-xs font-medium text-zinc-300">Label</span>
            <input
              value={node.data.label}
              onChange={(event) => onUpdate(node.data.config, event.target.value)}
              className="h-10 w-full rounded-lg border border-white/[.08] bg-black/25 px-3 text-sm text-zinc-100 outline-none focus:border-violet-400/50"
            />
          </label>

          {definition.fields.map((field) => (
            <NodeField
              key={field.key}
              field={field}
              value={node.data.config[field.key] || ""}
              previousGroups={previousGroups}
              onFocus={() => setActiveField(field.key)}
              onChange={(value) => updateConfig(field.key, value)}
              onMappingDrop={(expression) => setMapping(expression, field.key)}
              onMappingSelect={(expression) => updateConfig(field.key, expression)}
            />
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-white/[.08] bg-white/[.03] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-white">Input data</div>
              <div className="mt-1 text-[11px] text-zinc-500">Choose fields from connected upstream nodes.</div>
            </div>
            <span className="rounded-full bg-white/[.06] px-2 py-1 text-[10px] text-zinc-400">{activeField || "no field"}</span>
          </div>

          <div className="space-y-3">
            {!previousGroups.length && (
              <div className="rounded-lg border border-dashed border-white/[.1] p-3 text-xs leading-5 text-zinc-500">
                Connect a previous node to see output fields here.
              </div>
            )}

            {previousGroups.map((group) => (
              <div key={group.node.id} className="rounded-lg border border-white/[.07] bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-zinc-200">Previous Node: {group.node.data.label}</div>
                    <div className="mt-1 truncate text-[10px] text-zinc-600">{group.node.id}</div>
                  </div>
                  <span className="rounded-full bg-white/[.06] px-2 py-1 text-[10px] text-zinc-500">{group.fields.length} fields</span>
                </div>

                {group.fields.length ? (
                  <div className="mt-3 grid gap-2">
                    {group.fields.map((field) => {
                      const expression = mappingExpression(group.node, field, previousGroups.length);
                      return (
                        <button
                          key={`${group.node.id}-${field.key}`}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("application/voxora-mapping", expression);
                            event.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => setMapping(expression)}
                          className="flex items-center justify-between gap-3 rounded-md border border-white/[.06] bg-white/[.035] px-2 py-2 text-left text-xs transition hover:border-violet-400/35 hover:bg-white/[.06]"
                          title={expression}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-mono text-sky-200">{field.key}</span>
                            <span className="mt-0.5 block truncate text-[10px] text-zinc-600">{field.type}</span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-zinc-500">{expression}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-dashed border-white/[.1] p-3 text-xs leading-5 text-zinc-500">
                    No output fields available. Run this node or define its output schema.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[.08] p-3">
        <div className="text-[11px] text-zinc-500">Mappings save in node config.</div>
        <button onClick={onDelete} className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-400/10 px-3 text-xs font-semibold text-rose-200 hover:bg-rose-400/15">
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  );
}

function RunLogBar({ logs, onClose }: { logs: WorkflowRunLog[]; onClose: () => void }) {
  return (
    <div className="absolute bottom-5 right-5 z-20 w-80 rounded-xl border border-white/[.08] bg-[#0c1018]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex items-center justify-between text-xs font-semibold text-white">
        Last run
        <button onClick={onClose} className="grid size-6 place-items-center rounded-md hover:bg-white/[.06]" aria-label="Close run log">
          <X size={13} />
        </button>
      </div>
      <div className="mt-2 max-h-32 space-y-2 overflow-auto">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg bg-white/[.04] px-2 py-1.5 text-[11px] text-zinc-400">
            <span className="text-zinc-200">{log.nodeLabel}</span>: {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}

async function runVoiceCalls(workflow: WorkflowDraft, user: AuthUser | null): Promise<WorkflowRunLog[]> {
  const voiceNodes = workflow.nodes.filter((node) => normalizeKind(node.type) === "call_voice");
  if (!voiceNodes.length) return [];

  return Promise.all(voiceNodes.map(async (node) => {
    const normalizedPhone = normalizeRunnablePhone(node.config.phoneNumber || "");
    if (!normalizedPhone.ok) return workflowLog(node, "error", normalizedPhone.message);

    const defaultNiche = user?.default_niche?.trim();
    if (!defaultNiche) return workflowLog(node, "error", "Set a default niche in the workspace before running a call.");

    try {
      const response = await api.startOutboundCall({
        to_number: normalizedPhone.value,
        niche: defaultNiche,
        business_name: user?.business_name,
        business_details: user?.business_details,
        campaign_goal: node.config.goal?.trim() || `Call the customer for ${user?.business_name || "the business"} and capture the outcome.`,
      });
      return workflowLog(node, "success", `Call queued to ${normalizedPhone.value}. SID: ${response.call_sid}`);
    } catch (error) {
      return workflowLog(node, "error", error instanceof Error ? error.message : "Could not place outbound call.");
    }
  }));
}

function workflowLog(node: WorkflowNode, status: WorkflowRunLog["status"], message: string): WorkflowRunLog {
  return {
    id: makeId("log"),
    nodeId: node.id,
    nodeLabel: node.label,
    status,
    message,
    timestamp: new Date().toISOString(),
  };
}

function NodeField({
  field,
  value,
  previousGroups,
  onFocus,
  onChange,
  onMappingDrop,
  onMappingSelect,
}: {
  field: NodeConfigField;
  value: string;
  previousGroups: PreviousNodeGroup[];
  onFocus: () => void;
  onChange: (value: string) => void;
  onMappingDrop: (expression: string) => void;
  onMappingSelect: (expression: string) => void;
}) {
  const className = "w-full rounded-lg border border-white/[.08] bg-black/25 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400/50";
  const mappingOptions = previousGroups.flatMap((group) => group.fields.map((outputField) => ({
    nodeId: group.node.id,
    nodeLabel: group.node.data.label,
    field: outputField,
    expression: mappingExpression(group.node, outputField, previousGroups.length),
  })));
  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (event.dataTransfer.types.includes("application/voxora-mapping")) event.preventDefault();
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      const expression = event.dataTransfer.getData("application/voxora-mapping");
      if (!expression) return;
      event.preventDefault();
      onMappingDrop(expression);
    },
  };

  return (
    <label className="space-y-2">
      <span className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-zinc-300">{field.label}</span>
        {field.kind !== "select" && (
          <select
            value=""
            onFocus={onFocus}
            onChange={(event) => {
              if (!event.target.value) return;
              onMappingSelect(event.target.value);
              event.currentTarget.value = "";
            }}
            disabled={!mappingOptions.length}
            className="h-7 max-w-44 rounded-md border border-white/[.08] bg-black/30 px-2 text-[11px] text-zinc-300 outline-none disabled:cursor-not-allowed disabled:text-zinc-700"
          >
            <option value="">{mappingOptions.length ? "Use field" : "No fields"}</option>
            {previousGroups.map((group) => (
              <optgroup key={group.node.id} label={group.node.data.label}>
                {group.fields.map((outputField) => {
                  const expression = mappingExpression(group.node, outputField, previousGroups.length);
                  return <option key={`${group.node.id}-${outputField.key}`} value={expression}>{outputField.key}</option>;
                })}
              </optgroup>
            ))}
          </select>
        )}
      </span>
      {field.kind === "textarea" ? (
        <textarea value={value} onFocus={onFocus} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className={cn(className, "min-h-24 resize-y py-2")} {...dropHandlers} />
      ) : field.kind === "select" ? (
        <select value={value} onFocus={onFocus} onChange={(event) => onChange(event.target.value)} className={cn(className, "h-10")} {...dropHandlers}>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : field.kind === "phone" && !isMappingValue(value) ? (
        <PhoneInputField
          value={value}
          placeholder={field.placeholder}
          className={className}
          onFocus={onFocus}
          onChange={onChange}
          dropHandlers={dropHandlers}
        />
      ) : (
        <input value={value} onFocus={onFocus} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className={cn(className, "h-10")} {...dropHandlers} />
      )}
    </label>
  );
}

function PhoneInputField({
  value,
  placeholder,
  className,
  onFocus,
  onChange,
  dropHandlers,
}: {
  value: string;
  placeholder?: string;
  className: string;
  onFocus: () => void;
  onChange: (value: string) => void;
  dropHandlers: {
    onDragOver: (event: DragEvent<HTMLElement>) => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
  };
}) {
  const phone = splitPhoneNumber(value, DEFAULT_COUNTRY_CODE);
  const countryOption = countryOptionFor(phone.countryCode);

  function updateCountryCode(countryCode: string) {
    onChange(formatPhoneNumber(countryCode, phone.digits));
  }

  function updateDigits(nextValue: string) {
    onChange(formatPhoneNumber(phone.countryCode, nextValue));
  }

  return (
    <div className="flex h-10 overflow-hidden rounded-lg border border-white/[.08] bg-black/25 focus-within:border-violet-400/50" {...dropHandlers}>
      <select
        value={phone.countryCode}
        onFocus={onFocus}
        onChange={(event) => updateCountryCode(event.target.value)}
        className="h-full border-r border-white/[.08] bg-black/30 px-2 text-xs font-medium text-zinc-300 outline-none"
        aria-label="Country code"
      >
        {COUNTRY_CODE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>{option.label}</option>
        ))}
      </select>
      <input
        value={phone.digits}
        onFocus={onFocus}
        onChange={(event) => updateDigits(event.target.value)}
        placeholder={countryOption.placeholder || placeholder}
        className={cn(className, "h-full min-w-0 flex-1 border-0 bg-transparent px-3 focus:border-transparent")}
        inputMode="numeric"
        autoComplete="tel"
      />
    </div>
  );
}

function isMappingValue(value: string) {
  return /\{\{.+\}\}/.test(value.trim());
}

function normalizeRunnablePhone(value: string): { ok: true; value: string } | { ok: false; message: string } {
  if (isMappingValue(value)) return { ok: false, message: "Resolve the mapped phone value before running this call node." };
  return normalizePhoneNumber(value, DEFAULT_COUNTRY_CODE);
}

function getPreviousNodeGroups(targetNode: BuilderNode, nodes: BuilderNode[], edges: BuilderEdge[]): PreviousNodeGroup[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const seen = new Set<string>();
  const groups: PreviousNodeGroup[] = [];
  const queue = edges.filter((edge) => edge.target === targetNode.id).map((edge) => edge.source);

  while (queue.length) {
    const nodeId = queue.shift();
    if (!nodeId || seen.has(nodeId)) continue;
    const node = nodesById.get(nodeId);
    if (!node) continue;

    seen.add(node.id);
    groups.push({ node, fields: getNodeOutputSchema(node) });
    queue.push(...edges.filter((edge) => edge.target === node.id).map((edge) => edge.source));
  }

  return groups;
}

function getNodeOutputSchema(node: BuilderNode): OutputField[] {
  const dynamicSchema = parseOutputSchema(node.data.config.__outputSchema || node.data.config.responseSchema || "");
  if (dynamicSchema.length) return dynamicSchema;
  return NODE_DEFINITIONS[node.data.kind].outputSchema;
}

function parseOutputSchema(raw: string): OutputField[] {
  const value = raw.trim();
  if (!value) return [];

  try {
    return schemaFromParsedValue(JSON.parse(value));
  } catch {}

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((key) => ({ key, label: key, type: "unknown" }));
}

function schemaFromParsedValue(value: unknown): OutputField[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return { key: item, label: item, type: "unknown" };
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const key = String(record.key || record.name || "");
          if (!key) return null;
          return {
            key,
            label: String(record.label || key),
            type: String(record.type || "unknown"),
            description: typeof record.description === "string" ? record.description : undefined,
          };
        }
        return null;
      })
      .filter((item): item is OutputField => Boolean(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const properties = record.properties && typeof record.properties === "object" ? record.properties as Record<string, unknown> : record;
    return Object.entries(properties).map(([key, property]) => {
      if (property && typeof property === "object" && "type" in property) {
        return { key, label: key, type: String((property as Record<string, unknown>).type || "unknown") };
      }
      return { key, label: key, type: inferType(property) };
    });
  }

  return [];
}

function inferType(value: unknown) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function mappingExpression(sourceNode: BuilderNode, field: OutputField, previousGroupCount: number) {
  const reference = previousGroupCount === 1 ? "previousNode" : sourceNode.id;
  return `{{${reference}.${field.key}}}`;
}

function workflowToFlowNodes(workflow: WorkflowDraft): BuilderNode[] {
  return workflow.nodes.map(workflowNodeToFlowNode);
}

function workflowNodeToFlowNode(node: WorkflowNode): BuilderNode {
  const kind = normalizeKind(node.type);
  const definition = NODE_DEFINITIONS[kind];
  return {
    id: node.id,
    type: "workflowNode",
    position: { x: node.x, y: node.y },
    data: {
      kind,
      label: normalizeNodeLabel(node.label, kind, definition),
      description: definition.description,
      config: node.config || {},
      status: node.status || "idle",
    },
  };
}

function workflowToFlowEdges(workflow: WorkflowDraft): BuilderEdge[] {
  const nodeKinds = new Map(workflow.nodes.map((node) => [node.id, normalizeKind(node.type)]));
  return workflow.edges.map((edge) => {
    const output = edge.output || "out";
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: output,
      type: "smoothstep",
      animated: true,
      label: edgeOutputLabel(nodeKinds.get(edge.source), output),
      labelStyle: { fill: "#d4d4d8", fontSize: 11, fontWeight: 600 },
      labelBgStyle: { fill: "#10141d", fillOpacity: 0.92 },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 8,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6" },
      style: { stroke: "#8b5cf6", strokeWidth: 2 },
      data: { output },
    };
  });
}

function flowNodeToWorkflowNode(node: BuilderNode): WorkflowNode {
  return {
    id: node.id,
    type: node.data.kind,
    label: node.data.label,
    x: Math.round(node.position.x),
    y: Math.round(node.position.y),
    config: node.data.config,
    status: node.data.status,
  };
}

function flowEdgeToWorkflowEdge(edge: BuilderEdge): WorkflowEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    output: String(edge.sourceHandle || edge.data?.output || "out"),
  };
}

function createWorkflowNode(kind: BuilderNodeKind, position: { x: number; y: number }, fixedId?: string, config: Record<string, string> = {}, label?: string): WorkflowNode {
  const definition = NODE_DEFINITIONS[kind];
  return {
    id: fixedId || makeId(kind),
    type: kind,
    label: label || definition.label,
    x: Math.round(position.x),
    y: Math.round(position.y),
    config: { ...Object.fromEntries(definition.fields.map((field) => [field.key, field.options?.[0] || ""])), ...config },
    status: "idle",
  };
}

function normalizeWorkflow(workflow: WorkflowDraft): WorkflowDraft {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) => {
      const kind = normalizeKind(node.type);
      const definition = NODE_DEFINITIONS[kind];
      return {
        ...node,
        type: kind,
        label: normalizeNodeLabel(node.label, kind, definition),
        config: node.config || {},
        status: node.status || "idle",
      };
    }),
    edges: workflow.edges || [],
  };
}

function normalizeKind(type: string): BuilderNodeKind {
  if (type in NODE_DEFINITIONS) return type as BuilderNodeKind;
  if (type.includes("trigger")) return "start_trigger";
  if (type.includes("ai")) return "ai_agent";
  if (type.includes("call")) return "call_voice";
  if (type.includes("lead") || type.includes("supabase")) return "lead_capture";
  if (type.includes("condition") || type.includes("switch")) return "condition";
  return "business_details";
}

function normalizeNodeLabel(label: string, kind: BuilderNodeKind, definition: NodeDefinition) {
  if (kind === "start_trigger" && (!label || label.toLowerCase().includes("manual"))) return "Start";
  return label || definition.label;
}

function edgeOutputLabel(kind: BuilderNodeKind | undefined, output: string) {
  if (kind === "condition") return output === "true" ? "Confirmed" : output === "false" ? "Not confirmed" : formatEdgeOutput(output);
  if (kind === "call_voice") return output === "completed" ? "Call finished" : output === "failed" ? "Call failed" : formatEdgeOutput(output);
  if (kind === "lead_capture" && output === "lead") return "Lead saved";
  return formatEdgeOutput(output);
}

function formatEdgeOutput(output: string) {
  return output
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function findOpenPosition(position: { x: number; y: number }, existingNodes: BuilderNode[]) {
  let next = { x: Math.round(position.x - NODE_WIDTH / 2), y: Math.round(position.y - NODE_HEIGHT / 2) };
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const overlaps = existingNodes.some((node) => Math.abs(node.position.x - next.x) < NODE_WIDTH && Math.abs(node.position.y - next.y) < NODE_HEIGHT);
    if (!overlaps) return next;
    next = { x: next.x + 42, y: next.y + 42 };
  }
  return next;
}

function saveLocalWorkflow(workflow: WorkflowDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORKFLOW_KEY, JSON.stringify(workflow));
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

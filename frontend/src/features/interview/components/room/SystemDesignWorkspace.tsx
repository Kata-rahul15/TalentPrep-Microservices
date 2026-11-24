import { useState } from 'react'
import {
  Layers,
  Server,
  Database,
  Cpu,
  Globe,
  Radio,
  Plus,
  Trash2,
  Minimize2,
} from 'lucide-react'
import type { SystemDesignNode } from '../../types/interview.types'

interface SystemDesignWorkspaceProps {
  isOpen: boolean
  onToggle: () => void
  onAppendToAnswer?: (architectureSummary: string) => void
  className?: string
}

export default function SystemDesignWorkspace({
  isOpen,
  onToggle,
  onAppendToAnswer,
  className = '',
}: SystemDesignWorkspaceProps) {
  const [nodes, setNodes] = useState<SystemDesignNode[]>([
    { id: 'node-1', type: 'client', label: 'Client (Web/Mobile)', x: 40, y: 50 },
    { id: 'node-2', type: 'gateway', label: 'API Gateway / LB', x: 220, y: 50 },
    { id: 'node-3', type: 'service', label: 'Core Auth Service', x: 420, y: 30 },
    { id: 'node-4', type: 'service', label: 'Order Service', x: 420, y: 130 },
    { id: 'node-5', type: 'cache', label: 'Redis Cache', x: 620, y: 30 },
    { id: 'node-6', type: 'database', label: 'PostgreSQL Primary', x: 620, y: 130 },
  ])

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const addNode = (type: SystemDesignNode['type'], defaultLabel: string) => {
    const newNode: SystemDesignNode = {
      id: `node-${Date.now()}`,
      type,
      label: defaultLabel,
      x: 200 + Math.random() * 200,
      y: 60 + Math.random() * 100,
    }
    setNodes((prev) => [...prev, newNode])
    setSelectedNodeId(newNode.id)
  }

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId))
    setSelectedNodeId(null)
  }

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const node = nodes.find((n) => n.id === id)
    if (!node) return
    setSelectedNodeId(id)
    setDraggedNodeId(id)
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNodeId) return
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== draggedNodeId) return n
        return {
          ...n,
          x: Math.max(10, Math.min(800, e.clientX - dragOffset.x)),
          y: Math.max(10, Math.min(320, e.clientY - dragOffset.y)),
        }
      })
    )
  }

  const handleMouseUp = () => {
    setDraggedNodeId(null)
  }

  const getNodeIcon = (type: SystemDesignNode['type']) => {
    switch (type) {
      case 'client':
        return <Globe className="w-4 h-4 text-sky-500" />
      case 'gateway':
        return <Layers className="w-4 h-4 text-purple-500" />
      case 'service':
        return <Cpu className="w-4 h-4 text-blue-500" />
      case 'database':
        return <Database className="w-4 h-4 text-emerald-500" />
      case 'cache':
        return <Radio className="w-4 h-4 text-amber-500" />
      case 'queue':
        return <Server className="w-4 h-4 text-rose-500" />
    }
  }

  const exportSummaryToAnswer = () => {
    const summary = `System Architecture Components:\n${nodes
      .map((n) => `• [${n.type.toUpperCase()}] ${n.label}`)
      .join('\n')}\nData flow: Client -> API Gateway -> Services -> Cache & Primary Databases`
    if (onAppendToAnswer) {
      onAppendToAnswer(summary)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card hover:bg-secondary-bg border border-border text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs ${className}`}
        title="Open Architecture Whiteboard"
      >
        <Layers className="w-3.5 h-3.5 text-blue-600" />
        <span>Architecture Whiteboard ({nodes.length} nodes)</span>
      </button>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 space-y-3 shadow-md transition-all ${className}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ── Toolbar Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Architecture Whiteboard</h3>
            <p className="text-[10px] text-muted-foreground">
              Draft distributed components & service topologies
            </p>
          </div>
        </div>

        {/* Node Addition Quick Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => addNode('gateway', 'API Gateway')}
            className="px-2 py-1 rounded bg-secondary-bg hover:bg-muted border border-border text-[11px] font-medium text-foreground flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Gateway</span>
          </button>
          <button
            type="button"
            onClick={() => addNode('service', 'Microservice')}
            className="px-2 py-1 rounded bg-secondary-bg hover:bg-muted border border-border text-[11px] font-medium text-foreground flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Service</span>
          </button>
          <button
            type="button"
            onClick={() => addNode('database', 'Database')}
            className="px-2 py-1 rounded bg-secondary-bg hover:bg-muted border border-border text-[11px] font-medium text-foreground flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Database</span>
          </button>
          <button
            type="button"
            onClick={() => addNode('cache', 'Redis Cache')}
            className="px-2 py-1 rounded bg-secondary-bg hover:bg-muted border border-border text-[11px] font-medium text-foreground flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Cache</span>
          </button>
          <button
            type="button"
            onClick={() => addNode('queue', 'Kafka Queue')}
            className="px-2 py-1 rounded bg-secondary-bg hover:bg-muted border border-border text-[11px] font-medium text-foreground flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Queue</span>
          </button>

          {selectedNodeId && (
            <button
              type="button"
              onClick={deleteSelectedNode}
              className="p-1 rounded bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 text-xs transition-colors cursor-pointer"
              title="Delete selected component"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onAppendToAnswer && (
            <button
              type="button"
              onClick={exportSummaryToAnswer}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
              title="Copy architecture nodes into your answer text"
            >
              Append to Answer
            </button>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
            title="Collapse whiteboard"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Interactive Canvas Surface ── */}
      <div className="relative w-full h-[240px] bg-secondary-bg/50 border border-dashed border-border rounded-xl overflow-hidden select-none">
        {/* Architectural Grid Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        {/* Render Connective Lines between adjacent nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.map((node, i) => {
            const nextNode = nodes[i + 1]
            if (!nextNode) return null
            return (
              <line
                key={`line-${node.id}-${nextNode.id}`}
                x1={node.x + 80}
                y1={node.y + 24}
                x2={nextNode.x + 80}
                y2={nextNode.y + 24}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            )
          })}
        </svg>

        {/* Draggable Component Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            style={{ left: `${node.x}px`, top: `${node.y}px` }}
            className={`absolute px-3 py-2 rounded-xl bg-card border text-xs shadow-sm flex items-center gap-2 cursor-grab active:cursor-grabbing transition-shadow ${
              selectedNodeId === node.id
                ? 'border-blue-600 ring-2 ring-blue-500/20'
                : 'border-border hover:border-slate-400'
            }`}
          >
            {getNodeIcon(node.type)}
            <input
              type="text"
              value={node.label}
              onChange={(e) => {
                const newLabel = e.target.value
                setNodes((prev) =>
                  prev.map((n) => (n.id === node.id ? { ...n, label: newLabel } : n))
                )
              }}
              className="bg-transparent font-medium text-foreground text-xs focus:outline-none w-28 truncate"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

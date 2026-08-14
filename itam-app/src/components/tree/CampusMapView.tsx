'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  Monitor,
  X,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  MousePointer2,
  Square,
  Diamond,
  Circle,
  ArrowUpRight,
  Minus,
  Pencil,
  Type,
  Eraser,
  Laptop,
  Smartphone,
  Printer,
  Keyboard,
  Tablet,
  Package,
  Lock,
  Home,
  Palette,
  Trash2,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import type { AssetType, TreeDepartment, TreeEmployee } from '@/types/database';
import { ASSET_TYPE_AR } from '@/types/database';

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

interface CampusMapViewProps {
  treeData: { departments: TreeDepartment[] } | null;
}

interface Vec2 {
  x: number;
  y: number;
}

export type ToolType =
  | 'hand'
  | 'select'
  | 'rectangle'
  | 'diamond'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'pencil'
  | 'text'
  | 'eraser';

export interface CanvasElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Vec2[];
  text?: string;
  strokeColor: string;
  strokeWidth: number;
  fill: 'none' | 'semi' | 'solid';
}

// ─────────────────────────────────────────────────────────────
// Building Definitions
// ─────────────────────────────────────────────────────────────

const BUILDINGS = [
  { id: 'smart-oasis', name: 'Smart Oasis', nameAr: 'واحة الذكاء', isActive: true, emoji: '🏢', defaultPos: { x: 340, y: 220 } },
  { id: 'silk-road', name: 'Silk Road', nameAr: 'طريق الحرير', isActive: false, emoji: '🏛️', defaultPos: { x: 680, y: 190 } },
  { id: 'iraq-land', name: 'Iraq Land', nameAr: 'أرض العراق', isActive: false, emoji: '🏗️', defaultPos: { x: 240, y: 450 } },
  { id: 'bwe', name: 'BWE', nameAr: 'بي دبليو إي', isActive: false, emoji: '🏙️', defaultPos: { x: 640, y: 420 } },
] as const;

type BuildingId = (typeof BUILDINGS)[number]['id'];

const DEPT_COLORS = [
  '#22d3ee', '#34d399', '#a78bfa', '#fbbf24',
  '#fb7185', '#60a5fa', '#f472b6', '#38bdf8',
];

const STROKE_COLORS = [
  '#22d3ee', // Cyan
  '#a78bfa', // Purple
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#fb7185', // Rose
  '#f8fafc', // White
];

const ASSET_ICONS: Record<AssetType, React.ElementType> = {
  Laptop, Monitor, Keyboard,
  Mouse: MousePointer2,
  Printer, Phone: Smartphone, Tablet,
  Other: Monitor,
};

// Local storage helper
function loadPositions(key: string, defaults: Record<string, Vec2>): Record<string, Vec2> {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  } catch { return defaults; }
}
function savePositions(key: string, pos: Record<string, Vec2>) {
  try { localStorage.setItem(key, JSON.stringify(pos)); } catch { /* */ }
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function CampusMapView({ treeData }: CampusMapViewProps) {
  /* ── View & Selection State ── */
  const [view, setView] = useState<'campus' | 'building'>('campus');
  const [activeBuildingId, setActiveBuildingId] = useState<BuildingId | null>(null);
  const [selectedDept, setSelectedDept] = useState<TreeDepartment | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<TreeEmployee | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  /* ── Excalidraw Tool & Drawing State ── */
  const [activeTool, setActiveTool] = useState<ToolType>('hand');
  const [strokeColor, setStrokeColor] = useState('#22d3ee');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillStyle, setFillStyle] = useState<'none' | 'semi' | 'solid'>('semi');

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const isDrawing = useRef(false);
  const currentElement = useRef<CanvasElement | null>(null);

  /* ── Canvas Pan & Zoom ── */
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(1);
  const [isDraggingNode, setIsDraggingNode] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panOrigin = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });

  /* ── Positions ── */
  const defaultBldgPos = Object.fromEntries(BUILDINGS.map(b => [b.id, { ...b.defaultPos }]));
  const [buildingPos, setBuildingPos] = useState<Record<string, Vec2>>(() =>
    loadPositions('campus-building-pos', defaultBldgPos)
  );

  const depts = treeData?.departments ?? [];
  const defaultRoomPos = Object.fromEntries(
    depts.map((d, i) => [d.id, { x: 120 + (i % 4) * 220, y: 100 + Math.floor(i / 4) * 190 }])
  );
  const [roomPos, setRoomPos] = useState<Record<string, Vec2>>(() =>
    loadPositions('smart-oasis-room-pos', defaultRoomPos)
  );

  const activeBuilding = BUILDINGS.find(b => b.id === activeBuildingId);

  /* ── Pan & Zoom Handlers ── */
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(3, Math.max(0.2, scale + delta * scale));
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const ratio = newScale / scale;
    setTx(mx - ratio * (mx - tx));
    setTy(my - ratio * (my - ty));
    setScale(newScale);
  }, [scale, tx, ty]);

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = (e.clientX - rect.left - tx) / scale;
    const clickY = (e.clientY - rect.top - ty) / scale;

    if (activeTool === 'hand') {
      isPanning.current = true;
      panOrigin.current = { mx: e.clientX, my: e.clientY, tx, ty };
      return;
    }

    if (activeTool === 'select') {
      setSelectedElementId(null);
      return;
    }

    if (['rectangle', 'diamond', 'circle', 'arrow', 'line', 'pencil', 'text'].includes(activeTool)) {
      isDrawing.current = true;
      const newEl: CanvasElement = {
        id: `el-${Date.now()}`,
        type: activeTool,
        x: clickX,
        y: clickY,
        width: 0,
        height: 0,
        points: activeTool === 'pencil' ? [{ x: clickX, y: clickY }] : undefined,
        text: activeTool === 'text' ? 'نص جديد' : undefined,
        strokeColor,
        strokeWidth,
        fill: fillStyle,
      };
      currentElement.current = newEl;
      setElements(prev => [...prev, newEl]);
    }
  };

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      setTx(panOrigin.current.tx + (e.clientX - panOrigin.current.mx));
      setTy(panOrigin.current.ty + (e.clientY - panOrigin.current.my));
      return;
    }

    if (isDrawing.current && currentElement.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const currX = (e.clientX - rect.left - tx) / scale;
      const currY = (e.clientY - rect.top - ty) / scale;

      const updated = { ...currentElement.current };
      if (updated.type === 'pencil' && updated.points) {
        updated.points = [...updated.points, { x: currX, y: currY }];
      } else {
        updated.width = currX - updated.x;
        updated.height = currY - updated.y;
      }
      currentElement.current = updated;
      setElements(prev => prev.map(el => (el.id === updated.id ? updated : el)));
    }
  };

  const onCanvasMouseUp = () => {
    isPanning.current = false;
    if (isDrawing.current) {
      isDrawing.current = false;
      currentElement.current = null;
      if (activeTool !== 'pencil' && activeTool !== 'text') {
        setActiveTool('select');
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      if (canvas) canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  /* ── Keyboard Shortcuts ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedEmp) { setSelectedEmp(null); return; }
        if (selectedDept) { setSelectedDept(null); return; }
        if (view === 'building') backToCampus();
      }
      if (e.key === 'h' || e.key === 'H') setActiveTool('hand');
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'r' || e.key === 'R') setActiveTool('rectangle');
      if (e.key === 'c' || e.key === 'C') setActiveTool('circle');
      if (e.key === 'p' || e.key === 'P') setActiveTool('pencil');
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          setElements(prev => prev.filter(el => el.id !== selectedElementId));
          setSelectedElementId(null);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ── Navigation ── */
  const enterBuilding = (id: BuildingId) => {
    const b = BUILDINGS.find(x => x.id === id);
    if (!b?.isActive || isTransitioning) return;
    setIsTransitioning(true);
    setActiveBuildingId(id);
    setTx(0); setTy(0); setScale(1);
    setTimeout(() => {
      setView('building');
      setSelectedDept(null);
      setSelectedEmp(null);
      setIsTransitioning(false);
    }, 500);
  };

  const backToCampus = () => {
    setSelectedDept(null);
    setSelectedEmp(null);
    setIsTransitioning(true);
    setTx(0); setTy(0); setScale(1);
    setTimeout(() => {
      setView('campus');
      setActiveBuildingId(null);
      setIsTransitioning(false);
    }, 350);
  };

  /* ── Zoom Controls ── */
  const resetCanvas = () => { setTx(0); setTy(0); setScale(1); };
  const zoomIn = () => setScale(p => Math.min(3, p * 1.25));
  const zoomOut = () => setScale(p => Math.max(0.2, p / 1.25));

  /* ── Position Drag Savers ── */
  const saveRoom = (deptId: string, base: Vec2, offset: Vec2) => {
    const next = { x: base.x + offset.x / scale, y: base.y + offset.y / scale };
    setRoomPos(prev => {
      const updated = { ...prev, [deptId]: next };
      savePositions('smart-oasis-room-pos', updated);
      return updated;
    });
  };
  const saveBldg = (bId: string, base: Vec2, offset: Vec2) => {
    const next = { x: base.x + offset.x / scale, y: base.y + offset.y / scale };
    setBuildingPos(prev => {
      const updated = { ...prev, [bId]: next };
      savePositions('campus-building-pos', updated);
      return updated;
    });
  };

  const toolsList: { id: ToolType; label: string; icon: React.ElementType; shortcut: string }[] = [
    { id: 'hand', label: 'تحريك الكانفاس', icon: Hand, shortcut: 'H' },
    { id: 'select', label: 'تحديد عنصر', icon: MousePointer2, shortcut: 'V' },
    { id: 'rectangle', label: 'مستطيل', icon: Square, shortcut: 'R' },
    { id: 'diamond', label: 'معين', icon: Diamond, shortcut: 'D' },
    { id: 'circle', label: 'دائرة', icon: Circle, shortcut: 'C' },
    { id: 'arrow', label: 'سهم', icon: ArrowUpRight, shortcut: 'A' },
    { id: 'line', label: 'خط مستقيم', icon: Minus, shortcut: 'L' },
    { id: 'pencil', label: 'رسم حر', icon: Pencil, shortcut: 'P' },
    { id: 'text', label: 'نص', icon: Type, shortcut: 'T' },
    { id: 'eraser', label: 'ممحاة', icon: Eraser, shortcut: 'E' },
  ];

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-[#070d18]"
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onCanvasMouseMove}
      onMouseUp={onCanvasMouseUp}
    >
      {/* ═══ Excalidraw Dark Cross-hatch Grid ═══ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: `${24 * scale}px ${24 * scale}px`,
          backgroundPosition: `${tx % (24 * scale)}px ${ty % (24 * scale)}px`,
        }}
      />

      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      {/* ═══════════════════════════════════
          FLOATING TOP TOOLBAR (Excalidraw-Style)
      ═══════════════════════════════════ */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1 bg-oasis-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-oasis-800 p-1.5">
          {toolsList.map(t => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                title={`${t.label} (${t.shortcut})`}
                className={cn(
                  'relative p-2 rounded-xl transition-all duration-150 flex items-center justify-center',
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : 'text-oasis-400 hover:text-white hover:bg-oasis-800/60'
                )}
              >
                <Icon size={16} />
              </button>
            );
          })}

          <div className="w-px h-6 bg-oasis-800 mx-1" />

          {/* Zoom controls */}
          <button onClick={zoomOut} title="تصغير" className="p-2 rounded-xl text-oasis-400 hover:text-white hover:bg-oasis-800/60 transition-colors">
            <ZoomOut size={16} />
          </button>
          <button onClick={resetCanvas} title="إعادة ضبط" className="px-2 py-1 text-xs font-mono text-cyan-400 hover:bg-oasis-800/60 rounded-lg">
            {Math.round(scale * 100)}%
          </button>
          <button onClick={zoomIn} title="تكبير" className="p-2 rounded-xl text-oasis-400 hover:text-white hover:bg-oasis-800/60 transition-colors">
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════
          LEFT PROPERTY SIDEBAR (Shape Tweaks)
      ═══════════════════════════════════ */}
      <AnimatePresence>
        {['rectangle', 'diamond', 'circle', 'arrow', 'line', 'pencil', 'text', 'select'].includes(activeTool) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-16 left-3 z-30 flex flex-col gap-3 p-3 bg-oasis-900/90 backdrop-blur-xl rounded-2xl border border-oasis-800 shadow-xl"
          >
            {/* Color Swatches */}
            <div>
              <p className="text-[10px] text-oasis-500 font-medium mb-1.5 flex items-center gap-1">
                <Palette size={11} /> اللون
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {STROKE_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setStrokeColor(c)}
                    className={cn(
                      'w-5 h-5 rounded-md transition-transform border border-white/10',
                      strokeColor === c && 'scale-125 ring-2 ring-white/40'
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div className="pt-2 border-t border-oasis-800/60">
              <p className="text-[10px] text-oasis-500 font-medium mb-1.5">السُمك</p>
              <div className="flex gap-1">
                {[1, 2, 4].map(w => (
                  <button
                    key={w}
                    onClick={() => setStrokeWidth(w)}
                    className={cn(
                      'px-2 py-1 rounded-md text-[10px] font-mono border transition-all',
                      strokeWidth === w
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                        : 'text-oasis-400 border-oasis-800 hover:bg-oasis-800'
                    )}
                  >
                    {w === 1 ? 'رفيع' : w === 2 ? 'متوسط' : 'سميك'}
                  </button>
                ))}
              </div>
            </div>

            {/* Fill Style */}
            <div className="pt-2 border-t border-oasis-800/60">
              <p className="text-[10px] text-oasis-500 font-medium mb-1.5">التعبئة</p>
              <div className="flex gap-1">
                {(['none', 'semi', 'solid'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFillStyle(f)}
                    className={cn(
                      'px-2 py-1 rounded-md text-[10px] border transition-all',
                      fillStyle === f
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                        : 'text-oasis-400 border-oasis-800 hover:bg-oasis-800'
                    )}
                  >
                    {f === 'none' ? 'شفاف' : f === 'semi' ? 'خفيف' : 'كامل'}
                  </button>
                ))}
              </div>
            </div>

            {selectedElementId && (
              <button
                onClick={() => {
                  setElements(prev => prev.filter(el => el.id !== selectedElementId));
                  setSelectedElementId(null);
                }}
                className="mt-1 pt-2 border-t border-oasis-800/60 flex items-center justify-center gap-1 text-[10px] text-rose-400 hover:text-rose-300"
              >
                <Trash2 size={12} /> حذف العنصر
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Top-Right Breadcrumb Chip ═══ */}
      <div className="absolute top-3 right-3 z-30">
        <div className="flex items-center gap-1.5 bg-oasis-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-oasis-800 px-3.5 py-2">
          <button
            onClick={view === 'building' ? backToCampus : undefined}
            className={cn(
              'text-xs font-medium transition-colors flex items-center gap-1.5',
              view === 'campus' ? 'text-cyan-400 font-bold' : 'text-oasis-400 hover:text-white'
            )}
          >
            <Home size={13} /> الحرم الجامعي
          </button>
          {activeBuilding && (
            <>
              <ChevronLeft size={11} className="text-oasis-700" />
              <button
                onClick={selectedDept ? () => { setSelectedEmp(null); setSelectedDept(null); } : undefined}
                className={cn(
                  'text-xs font-medium transition-colors',
                  !selectedDept ? 'text-white font-bold' : 'text-oasis-400 hover:text-white'
                )}
              >
                {activeBuilding.emoji} {activeBuilding.name}
              </button>
            </>
          )}
          {selectedDept && (
            <>
              <ChevronLeft size={11} className="text-oasis-700" />
              <span className="text-xs font-bold text-white">{selectedDept.name}</span>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════
          CANVAS DRAWING & NODE LAYER
      ═══════════════════════════════════ */}
      <div
        ref={canvasRef}
        className={cn(
          'absolute inset-0 overflow-hidden',
          activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
        )}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* SVG Shape Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {elements.map(el => {
              const isSel = selectedElementId === el.id;
              const fillAlpha = el.fill === 'none' ? 'none' : el.fill === 'semi' ? `${el.strokeColor}22` : `${el.strokeColor}88`;

              if (el.type === 'rectangle') {
                return (
                  <rect
                    key={el.id}
                    x={Math.min(el.x, el.x + (el.width || 0))}
                    y={Math.min(el.y, el.y + (el.height || 0))}
                    width={Math.abs(el.width || 0)}
                    height={Math.abs(el.height || 0)}
                    stroke={el.strokeColor}
                    strokeWidth={el.strokeWidth}
                    fill={fillAlpha}
                    rx={6}
                    strokeDasharray={isSel ? '4 4' : undefined}
                  />
                );
              }
              if (el.type === 'circle') {
                const rx = Math.abs(el.width || 0) / 2;
                const ry = Math.abs(el.height || 0) / 2;
                return (
                  <ellipse
                    key={el.id}
                    cx={el.x + (el.width || 0) / 2}
                    cy={el.y + (el.height || 0) / 2}
                    rx={rx}
                    ry={ry}
                    stroke={el.strokeColor}
                    strokeWidth={el.strokeWidth}
                    fill={fillAlpha}
                    strokeDasharray={isSel ? '4 4' : undefined}
                  />
                );
              }
              if (el.type === 'pencil' && el.points && el.points.length > 0) {
                const pathData = el.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                return (
                  <path
                    key={el.id}
                    d={pathData}
                    stroke={el.strokeColor}
                    strokeWidth={el.strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              }
              if (el.type === 'line' || el.type === 'arrow') {
                return (
                  <g key={el.id}>
                    <line
                      x1={el.x}
                      y1={el.y}
                      x2={el.x + (el.width || 0)}
                      y2={el.y + (el.height || 0)}
                      stroke={el.strokeColor}
                      strokeWidth={el.strokeWidth}
                      strokeDasharray={isSel ? '4 4' : undefined}
                    />
                  </g>
                );
              }
              return null;
            })}
          </svg>

          {/* Text Elements */}
          {elements.filter(el => el.type === 'text').map(el => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                color: el.strokeColor,
                fontFamily: 'var(--font-caveat), cursive',
              }}
              className="text-lg font-semibold pointer-events-none select-none"
            >
              {el.text}
            </div>
          ))}

          {/* ─── CAMPUS BUILDINGS & ROOMS VIEW ─── */}
          <AnimatePresence mode="wait">
            {view === 'campus' && (
              <motion.div key="campus-nodes">
                {BUILDINGS.map((b, i) => {
                  const pos = buildingPos[b.id] || b.defaultPos;
                  return (
                    <motion.div
                      key={b.id}
                      drag={activeTool === 'hand' || activeTool === 'select'}
                      dragMomentum={false}
                      data-node="building"
                      initial={{ x: pos.x, y: pos.y, opacity: 0, scale: 0.6 }}
                      animate={{ x: pos.x, y: pos.y, opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08, duration: 0.45 }}
                      onDragStart={() => { setIsDraggingNode(true); isPanning.current = false; }}
                      onDragEnd={(_, info) => { setIsDraggingNode(false); saveBldg(b.id, pos, info.offset); }}
                      whileDrag={{ scale: 1.1, zIndex: 200 }}
                      style={{ position: 'absolute', cursor: 'grab' }}
                      className="select-none"
                    >
                      <motion.div
                        whileHover={b.isActive ? { scale: 1.08, y: -4 } : {}}
                        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                        onClick={() => !isDraggingNode && enterBuilding(b.id as BuildingId)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 py-4 px-6 rounded-3xl transition-all',
                          b.isActive ? 'cursor-pointer hover:bg-oasis-900/40' : 'cursor-not-allowed opacity-35'
                        )}
                      >
                        {/* Emoji Icon */}
                        <span className="text-6xl leading-none drop-shadow-2xl">{b.emoji}</span>

                        {/* Handwritten Name */}
                        <span
                          className="text-base font-bold text-white tracking-wide"
                          style={{ fontFamily: 'var(--font-caveat), cursive' }}
                        >
                          {b.name}
                        </span>

                        {/* Status / Count */}
                        {!b.isActive ? (
                          <span className="flex items-center gap-1 text-[10px] text-oasis-500">
                            <Lock size={9} /> قريباً
                          </span>
                        ) : treeData ? (
                          <span className="text-[10px] text-cyan-400 font-mono">
                            {depts.length} قسم · {depts.reduce((s, d) => s + d.employees.length, 0)} موظف
                          </span>
                        ) : null}

                        {/* Clean Dashed Outline */}
                        {b.isActive && (
                          <div
                            className="absolute -inset-4 rounded-3xl pointer-events-none"
                            style={{ border: '2px dashed rgba(34,211,238,0.25)' }}
                          />
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ─── BUILDING ROOMS VIEW ─── */}
            {view === 'building' && activeBuilding && (
              <motion.div key="building-nodes">
                {depts.map((dept, i) => {
                  const color = DEPT_COLORS[i % DEPT_COLORS.length];
                  const pos = roomPos[dept.id] || { x: 120 + (i % 4) * 220, y: 100 + Math.floor(i / 4) * 190 };
                  const deptAssets = dept.employees.reduce((s, e) => s + e.assets.length, 0);
                  const isSelected = selectedDept?.id === dept.id;

                  return (
                    <motion.div
                      key={dept.id}
                      drag={activeTool === 'hand' || activeTool === 'select'}
                      dragMomentum={false}
                      data-node="room"
                      initial={{ x: pos.x, y: pos.y, opacity: 0, scale: 0.6 }}
                      animate={{ x: pos.x, y: pos.y, opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06, duration: 0.4 }}
                      onDragEnd={(_, info) => saveRoom(dept.id, pos, info.offset)}
                      whileDrag={{ scale: 1.08, zIndex: 100 }}
                      style={{ position: 'absolute', cursor: 'grab' }}
                      className="select-none"
                    >
                      <motion.div
                        whileHover={{ scale: 1.06, y: -3 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          if (isDraggingNode) return;
                          setSelectedDept(dept);
                          setSelectedEmp(null);
                        }}
                        className={cn(
                          'flex flex-col items-center gap-1.5 py-3.5 px-6 rounded-2xl backdrop-blur-md cursor-pointer transition-all',
                          isSelected ? 'bg-oasis-900/90 shadow-2xl' : 'bg-oasis-950/60 hover:bg-oasis-900/60'
                        )}
                        style={{
                          border: `1px solid ${color}40`,
                          boxShadow: isSelected ? `0 0 30px ${color}40` : undefined,
                        }}
                      >
                        <div className="w-4 h-4 rounded-full" style={{ background: color }} />
                        <span
                          className="text-base font-bold text-white whitespace-nowrap"
                          style={{ fontFamily: 'var(--font-caveat), cursive' }}
                        >
                          {dept.name}
                        </span>
                        <span className="text-[10px] text-oasis-400">
                          {dept.employees.length} موظف · {deptAssets} جهاز
                        </span>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══ Cinematic Portal Overlay ═══ */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-oasis-950/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.3, 1], opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-6xl"
            >
              {activeBuildingId ? BUILDINGS.find(b => b.id === activeBuildingId)?.emoji : '🏢'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════
          DEPARTMENT PANEL (Right Slide-in)
      ═══════════════════════════════════ */}
      <AnimatePresence>
        {selectedDept && (
          <motion.aside
            key="dept-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
            className="absolute top-3 bottom-3 left-3 w-80 flex flex-col z-30
                       bg-oasis-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-oasis-800 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-oasis-800">
              <div>
                <h3 className="font-bold text-white text-base" style={{ fontFamily: 'var(--font-caveat), cursive' }}>
                  {selectedDept.name}
                </h3>
                <p className="text-[11px] text-oasis-400 mt-0.5">
                  {selectedDept.employees.length} موظف ·{' '}
                  {selectedDept.employees.reduce((s, e) => s + e.assets.length, 0)} جهاز
                </p>
              </div>
              <button
                onClick={() => { setSelectedDept(null); setSelectedEmp(null); }}
                className="p-1.5 rounded-xl text-oasis-400 hover:text-white hover:bg-oasis-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {selectedDept.employees.length === 0 ? (
                <div className="py-12 text-center text-oasis-500 text-sm">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  لا يوجد موظفون في هذا القسم
                </div>
              ) : (
                selectedDept.employees.map((emp, i) => (
                  <motion.button
                    key={emp.id}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedEmp(emp)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all',
                      'border border-transparent',
                      selectedEmp?.id === emp.id
                        ? 'bg-cyan-500/15 border-cyan-500/30'
                        : 'hover:bg-oasis-800/50 hover:border-oasis-800'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center
                                    text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium text-oasis-100 truncate">{emp.name}</p>
                      <p className="text-[11px] text-oasis-500 truncate">{emp.job_title || '—'}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-oasis-950 text-oasis-400 font-mono shrink-0">
                      {emp.assets.length}
                    </span>
                  </motion.button>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══ Employee Assets Panel ═══ */}
      <AnimatePresence>
        {selectedEmp && (
          <motion.aside
            key="emp-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
            className="absolute top-3 bottom-3 left-[21.5rem] w-72 flex flex-col z-30
                       bg-oasis-950/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-oasis-800 overflow-hidden"
          >
            <div className="p-4 border-b border-oasis-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center
                                  text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                    {selectedEmp.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedEmp.name}</p>
                    <p className="text-[11px] text-oasis-400">{selectedEmp.job_title || '—'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmp(null)}
                  className="p-1.5 rounded-xl text-oasis-400 hover:text-white hover:bg-oasis-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mt-2.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-oasis-900 border border-oasis-800 text-cyan-400 font-mono">
                  {selectedEmp.assets.length} جهاز مسلّم
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedEmp.assets.length === 0 ? (
                <div className="py-12 text-center text-oasis-500">
                  <Package size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد أجهزة مسلّمة</p>
                </div>
              ) : (
                selectedEmp.assets.map((asset, i) => {
                  const Icon = ASSET_ICONS[asset.type] ?? Monitor;
                  return (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-3 rounded-xl bg-oasis-900/60 border border-oasis-800/80 hover:border-oasis-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-oasis-800 shrink-0">
                          <Icon size={13} className="text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-mono text-cyan-400 truncate">{asset.asset_tag}</p>
                          <p className="text-[10px] text-oasis-300 truncate">{asset.brand} {asset.model}</p>
                        </div>
                        <StatusBadge status={asset.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-oasis-500">
                        <span>{ASSET_TYPE_AR[asset.type]}</span>
                        {asset.serial && (<><span>·</span><span className="font-mono">{asset.serial}</span></>)}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══ Bottom-Right Status Bar ═══ */}
      <AnimatePresence>
        {!isTransitioning && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-3 right-3 z-20 flex items-center gap-2.5
                       bg-oasis-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-oasis-800
                       px-3.5 py-1.5 text-[10px] text-oasis-400 select-none"
          >
            <span className="font-bold text-white">
              {view === 'campus' ? '🏫 الحرم الجامعي' : `${activeBuilding?.emoji} ${activeBuilding?.name}`}
            </span>
            <span className="text-oasis-700">|</span>
            <span className="font-mono text-cyan-400">{Math.round(scale * 100)}%</span>
            <span className="text-oasis-700">|</span>
            {view === 'campus' ? (
              <span>انقر مبنى للدخول · اسحب الكانفاس بـ (H)</span>
            ) : (
              <span>انقر قسم · Esc للرجوع</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

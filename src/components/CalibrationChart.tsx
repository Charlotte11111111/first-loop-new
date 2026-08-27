import React, { useRef, useState } from 'react';
import { DataPoint, SignalQuality } from '../types';

interface CalibrationChartProps {
  type: 'eda' | 'hr';
  data: DataPoint[];
  quality: SignalQuality;
  hoveredTime: number | null;
  setHoveredTime: (time: number | null) => void;
  isTwoPhase?: boolean;
}

type ChartPoint = { time: number; value: number; sourceTime: number };

/**
 * EDA: Rest + Stroop only (source 0–75s)
 * HR: Rest + Coherence only (source Rest 0–30 + Coherence 75–120, remapped)
 */
function buildChartPoints(type: 'eda' | 'hr', data: DataPoint[]): {
  points: ChartPoint[];
  maxTime: number;
  phases: { start: number; end: number; label: string; fill: string; text: string }[];
} {
  if (type === 'eda') {
    const points = data
      .filter((d) => d.time <= 75)
      .map((d) => ({ time: d.time, value: d.eda, sourceTime: d.time }));
    return {
      points,
      maxTime: 75,
      phases: [
        { start: 0, end: 30, label: 'Rest 0-30s', fill: '#e0f2fe', text: 'fill-sky-600/90' },
        { start: 30, end: 75, label: 'Stroop 30-75s', fill: '#fee2e2', text: 'fill-rose-600/90' },
      ],
    };
  }

  // HR: Rest then Coherence, no Stroop gap on the chart
  const rest = data
    .filter((d) => d.time <= 30)
    .map((d) => ({ time: d.time, value: d.hr, sourceTime: d.time }));
  const coherence = data
    .filter((d) => d.time >= 75)
    .map((d) => ({ time: 30 + (d.time - 75), value: d.hr, sourceTime: d.time }));
  return {
    points: [...rest, ...coherence],
    maxTime: 75,
    phases: [
      { start: 0, end: 30, label: 'Rest 0-30s', fill: '#e0f2fe', text: 'fill-sky-600/90' },
      { start: 30, end: 75, label: 'Coherence 30-75s', fill: '#dcfce7', text: 'fill-emerald-600/90' },
    ],
  };
}

export const CalibrationChart: React.FC<CalibrationChartProps> = ({
  type,
  data,
  quality,
  hoveredTime,
  setHoveredTime,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 315, height: 110 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: width || 315,
          height: 110,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const { width, height } = dimensions;
  const { points, maxTime, phases } = buildChartPoints(type, data);

  const paddingLeft = 32;
  const paddingRight = 12;
  const paddingTop = 14;
  const paddingBottom = 18;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const minEda = 0;
  const maxEda = 10;
  const minHr = 40;
  const maxHr = 130;

  const getX = (t: number) => paddingLeft + (t / maxTime) * chartWidth;

  const getY = (val: number) => {
    if (type === 'eda') {
      const clamped = Math.max(minEda, Math.min(maxEda, val));
      return paddingTop + chartHeight - (clamped / maxEda) * chartHeight;
    }
    const clamped = Math.max(minHr, Math.min(maxHr, val));
    const range = maxHr - minHr;
    return paddingTop + chartHeight - ((clamped - minHr) / range) * chartHeight;
  };

  const findPointForSourceTime = (sourceTime: number | null): ChartPoint => {
    if (sourceTime == null) return points[points.length - 1];
    let best = points[0];
    let bestDist = Infinity;
    for (const p of points) {
      const dist = Math.abs(p.sourceTime - sourceTime);
      if (dist < bestDist) {
        best = p;
        bestDist = dist;
      }
    }
    return best;
  };

  const activePoint = findPointForSourceTime(hoveredTime);
  const activeValue = activePoint.value;
  const unit = type === 'eda' ? 'μS' : 'bpm';
  const label = type === 'eda' ? 'Electrodermal Activity (EDA)' : 'Heart Rate (HR)';
  const colorClass = type === 'eda' ? 'text-blue-600 font-semibold' : 'text-emerald-600 font-semibold';

  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${getX(points[0].time)} ${getY(points[0].value)}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${getX(points[i].time)} ${getY(points[i].value)}`;
    }
  }

  const chartTimeToSource = (chartTime: number): number => {
    if (type === 'eda') return chartTime;
    if (chartTime <= 30) return chartTime;
    return 75 + (chartTime - 30);
  };

  const handlePointer = (clientX: number, currentTarget: SVGSVGElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const relativeX = clientX - rect.left - paddingLeft;
    const ratio = Math.max(0, Math.min(1, relativeX / chartWidth));
    const chartTime = Math.round(ratio * maxTime);
    setHoveredTime(chartTimeToSource(chartTime));
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    handlePointer(e.clientX, e.currentTarget);
  };

  const handleMouseLeave = () => setHoveredTime(null);

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 0) return;
    handlePointer(e.touches[0].clientX, e.currentTarget);
  };

  const cardBorderClass =
    quality === 'abnormal'
      ? 'border border-amber-300 shadow-[0_2px_12px_rgba(217,119,6,0.08)] bg-amber-50/10'
      : quality === 'rising'
        ? 'border border-rose-200 shadow-[0_2px_12px_rgba(244,63,94,0.06)] bg-rose-50/10'
        : quality === 'plateau'
          ? 'border border-sky-200 shadow-[0_2px_12px_rgba(14,165,233,0.05)] bg-sky-50/10'
          : 'border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] bg-white';

  const axisTicks = [0, 30, 75];

  return (
    <div
      ref={containerRef}
      className={`p-3 rounded-2xl transition-all duration-300 ${cardBorderClass}`}
    >
      <div className="flex items-baseline justify-between mb-1 px-1">
        <span className="text-[12px] font-medium text-slate-500 tracking-wide">{label}</span>
        <div className="flex items-baseline space-x-1">
          <span className={`text-lg font-mono tracking-tight font-bold ${colorClass}`}>
            {activeValue.toFixed(type === 'eda' ? 2 : 1)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono font-medium">{unit}</span>
        </div>
      </div>

      <div className="relative select-none" style={{ height }}>
        <svg
          width="100%"
          height={height}
          className="overflow-visible cursor-crosshair touch-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseLeave}
        >
          {phases.map((phase) => (
            <React.Fragment key={phase.label}>
              <rect
                x={getX(phase.start)}
                y={paddingTop}
                width={getX(phase.end) - getX(phase.start)}
                height={chartHeight}
                fill={phase.fill}
                fillOpacity="0.45"
                rx="2"
              />
              <text
                x={getX(phase.start) + (getX(phase.end) - getX(phase.start)) / 2}
                y={paddingTop + 11}
                textAnchor="middle"
                className={`text-[9px] font-medium ${phase.text} pointer-events-none`}
              >
                {phase.label}
              </text>
            </React.Fragment>
          ))}

          {type === 'eda'
            ? [2, 5, 8].map((val) => (
                <g key={val} className="opacity-40">
                  <line
                    x1={paddingLeft}
                    y1={getY(val)}
                    x2={width - paddingRight}
                    y2={getY(val)}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={paddingLeft - 6}
                    y={getY(val) + 3}
                    textAnchor="end"
                    className="text-[8px] font-mono fill-slate-400 pointer-events-none"
                  >
                    {val}
                  </text>
                </g>
              ))
            : [60, 80, 100, 120].map((val) => (
                <g key={val} className="opacity-40">
                  <line
                    x1={paddingLeft}
                    y1={getY(val)}
                    x2={width - paddingRight}
                    y2={getY(val)}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={paddingLeft - 6}
                    y={getY(val) + 3}
                    textAnchor="end"
                    className="text-[8px] font-mono fill-slate-400 pointer-events-none"
                  >
                    {val}
                  </text>
                </g>
              ))}

          <line
            x1={getX(30)}
            y1={paddingTop}
            x2={getX(30)}
            y2={paddingTop + chartHeight}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeOpacity="0.4"
          />

          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {axisTicks.map((t) => (
            <text
              key={t}
              x={getX(t)}
              y={paddingTop + chartHeight + 11}
              textAnchor={t === 0 ? 'start' : t === maxTime ? 'end' : 'middle'}
              className="text-[8px] font-mono fill-slate-400 pointer-events-none font-medium"
            >
              {t}s
            </text>
          ))}

          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={type === 'eda' ? '#2563eb' : '#059669'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-75"
            />
          )}

          {hoveredTime !== null && (
            <>
              <line
                x1={getX(activePoint.time)}
                y1={paddingTop}
                x2={getX(activePoint.time)}
                y2={paddingTop + chartHeight}
                stroke="#64748b"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                className="pointer-events-none"
              />
              <circle
                cx={getX(activePoint.time)}
                cy={getY(activeValue)}
                r="4.5"
                fill={type === 'eda' ? '#2563eb' : '#059669'}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="pointer-events-none shadow-sm"
              />
            </>
          )}
        </svg>

        {quality === 'abnormal' && (
          <div className="absolute top-2 right-2 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 text-[8px] font-semibold uppercase tracking-wide border border-amber-500/20 pointer-events-none animate-pulse">
            <span>⚠ Signal interference</span>
          </div>
        )}
        {quality === 'declining' && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-700 text-[8px] font-semibold border border-violet-500/20 pointer-events-none">
            ↓ Dip
          </div>
        )}
        {quality === 'rising' && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 text-[8px] font-semibold border border-rose-500/20 pointer-events-none">
            ↑ Strong rise
          </div>
        )}
        {quality === 'plateau' && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 text-[8px] font-semibold border border-sky-500/20 pointer-events-none">
            Mild change
          </div>
        )}
      </div>
    </div>
  );
};

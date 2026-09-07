import React, { useRef, useState } from 'react';
import { DataPoint, SignalQuality } from '../types';
import { REST_END, STROOP_END, BREATH_END } from '../utils';

interface CalibrationChartProps {
  type: 'eda' | 'hr';
  data: DataPoint[];
  quality: SignalQuality;
  hoveredTime: number | null;
  setHoveredTime: (time: number | null) => void;
  isTwoPhase?: boolean;
}

type ChartPoint = { time: number; value: number; sourceTime: number };

const PHASES = [
  { start: 0, end: REST_END, label: 'Rest', duration: '30s', fill: '#e0f2fe', text: '#0284c7', weight: 1 },
  { start: REST_END, end: STROOP_END, label: 'Stroop', duration: '50s', fill: '#ffe4e6', text: '#e11d48', weight: 1.1 },
  { start: STROOP_END, end: BREATH_END, label: 'Breathing', duration: '5 min', fill: '#dcfce7', text: '#059669', weight: 1.5 },
];

const PHASE_WEIGHT_TOTAL = PHASES.reduce((sum, p) => sum + p.weight, 0);

function timeToRatio(t: number) {
  let acc = 0;
  for (const phase of PHASES) {
    const span = phase.end - phase.start;
    const share = phase.weight / PHASE_WEIGHT_TOTAL;
    if (t <= phase.end) {
      const local = Math.max(0, t - phase.start) / span;
      return acc + local * share;
    }
    acc += share;
  }
  return 1;
}

function ratioToTime(ratio: number) {
  const clamped = Math.max(0, Math.min(1, ratio));
  let acc = 0;
  for (const phase of PHASES) {
    const share = phase.weight / PHASE_WEIGHT_TOTAL;
    if (clamped <= acc + share) {
      const local = share === 0 ? 0 : (clamped - acc) / share;
      return phase.start + local * (phase.end - phase.start);
    }
    acc += share;
  }
  return BREATH_END;
}

function buildChartPoints(type: 'eda' | 'hr', data: DataPoint[]): ChartPoint[] {
  return data.map((d) => ({
    time: d.time,
    value: type === 'eda' ? d.eda : d.hr,
    sourceTime: d.time,
  }));
}

export const CalibrationChart: React.FC<CalibrationChartProps> = ({
  type,
  data,
  hoveredTime,
  setHoveredTime,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 315, height: 150 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 315,
          height: 150,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const { width, height } = dimensions;
  const points = buildChartPoints(type, data);

  const paddingLeft = 4;
  const paddingRight = 4;
  const paddingTop = 22;
  const paddingBottom = 4;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const minEda = 1.4;
  const maxEda = 9.6;
  const minHr = 58;
  const maxHr = 108;

  const getX = (t: number) => paddingLeft + timeToRatio(t) * chartWidth;

  const getY = (val: number) => {
    if (type === 'eda') {
      const clamped = Math.max(minEda, Math.min(maxEda, val));
      return paddingTop + chartHeight - ((clamped - minEda) / (maxEda - minEda)) * chartHeight;
    }
    const clamped = Math.max(minHr, Math.min(maxHr, val));
    return paddingTop + chartHeight - ((clamped - minHr) / (maxHr - minHr)) * chartHeight;
  };

  const findPointForSourceTime = (sourceTime: number | null): ChartPoint => {
    if (sourceTime == null || points.length === 0) return points[points.length - 1];
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
  const stroke = type === 'eda' ? '#2563eb' : '#059669';
  const fillId = type === 'eda' ? 'edaFill' : 'hrFill';

  let lineD = '';
  if (points.length > 0) {
    lineD = `M ${getX(points[0].time)} ${getY(points[0].value)}`;
    for (let i = 1; i < points.length; i++) {
      lineD += ` L ${getX(points[i].time)} ${getY(points[i].value)}`;
    }
  }

  const areaD = lineD
    ? `${lineD} L ${getX(points[points.length - 1].time)} ${paddingTop + chartHeight} L ${getX(points[0].time)} ${paddingTop + chartHeight} Z`
    : '';

  const handlePointer = (clientX: number, currentTarget: SVGSVGElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const relativeX = clientX - rect.left - paddingLeft;
    const ratio = Math.max(0, Math.min(1, relativeX / chartWidth));
    setHoveredTime(Math.round(ratioToTime(ratio)));
  };

  return (
    <div ref={containerRef} className="relative select-none">
      <svg
        width="100%"
        height={height}
        className="overflow-visible cursor-crosshair touch-none"
        onMouseMove={(e) => handlePointer(e.clientX, e.currentTarget)}
        onMouseLeave={() => setHoveredTime(null)}
        onTouchMove={(e) => {
          if (e.touches[0]) handlePointer(e.touches[0].clientX, e.currentTarget);
        }}
        onTouchEnd={() => setHoveredTime(null)}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {PHASES.map((phase) => (
          <rect
            key={phase.label}
            x={getX(phase.start)}
            y={paddingTop}
            width={Math.max(0, getX(phase.end) - getX(phase.start))}
            height={chartHeight}
            fill={phase.fill}
            fillOpacity="0.55"
          />
        ))}

        {[REST_END, STROOP_END].map((t) => (
          <line
            key={t}
            x1={getX(t)}
            y1={paddingTop}
            x2={getX(t)}
            y2={paddingTop + chartHeight}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeOpacity="0.28"
            strokeDasharray="3 3"
          />
        ))}

        {areaD && <path d={areaD} fill={`url(#${fillId})`} />}
        {lineD && (
          <path
            d={lineD}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {hoveredTime !== null && activePoint && (
          <>
            <line
              x1={getX(activePoint.time)}
              y1={paddingTop}
              x2={getX(activePoint.time)}
              y2={paddingTop + chartHeight}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="3 3"
              className="pointer-events-none"
            />
            <circle
              cx={getX(activePoint.time)}
              cy={getY(activePoint.value)}
              r="4"
              fill={stroke}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="pointer-events-none"
            />
          </>
        )}

        {PHASES.map((phase) => {
          const w = getX(phase.end) - getX(phase.start);
          if (w < 28) return null;
          return (
            <text
              key={`${phase.label}-on`}
              x={getX(phase.start) + w / 2}
              y={paddingTop + 13}
              textAnchor="middle"
              fill={phase.text}
              fontSize="10"
              fontWeight="600"
              className="pointer-events-none"
            >
              {phase.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

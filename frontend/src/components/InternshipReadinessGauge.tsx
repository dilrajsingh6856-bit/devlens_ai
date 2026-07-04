import React from 'react';

interface InternshipReadinessGaugeProps {
  score: number;
}

export const InternshipReadinessGauge: React.FC<InternshipReadinessGaugeProps> = ({ score }) => {
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine color theme based on score
  let strokeColor = "#ef4444"; // Danger
  let textColor = "text-red-400";
  let statusText = "Needs Work";
  let statusBg = "bg-red-950 text-red-400 border-red-900";

  if (score >= 80) {
    strokeColor = "#10b981"; // Success
    textColor = "text-emerald-400";
    statusText = "Internship Ready";
    statusBg = "bg-emerald-950 text-emerald-400 border-emerald-900";
  } else if (score >= 65) {
    strokeColor = "#f59e0b"; // Warning
    textColor = "text-amber-400";
    statusText = "Progressing";
    statusBg = "bg-amber-950 text-amber-400 border-amber-900";
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative flex items-center justify-center">
        {/* SVG Circle Gauge */}
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#27272a"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Colored progress circle */}
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
        </svg>

        {/* Text inside circle */}
        <div className="absolute text-center">
          <span className={`text-2xl font-bold ${textColor}`}>
            {score}%
          </span>
        </div>
      </div>

      {/* Label Badge */}
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBg}`}>
        {statusText}
      </span>
    </div>
  );
};

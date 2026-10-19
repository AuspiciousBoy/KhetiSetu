import React from 'react';

const ProgressRing = ({
  progress = 0, // 0 to 100
  size = 80,
  strokeWidth = 8,
  className = '',
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Soft Sand Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1eee5"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Deep Forest Progress Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#08241a"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-bold text-primary font-display">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};

export default ProgressRing;

import React from 'react';

interface VegBadgeProps {
  isVeg: boolean;
  className?: string;
}

export default function VegBadge({ isVeg, className = '' }: VegBadgeProps) {
  if (isVeg) {
    return (
      <span
        title="Vegetarian"
        className={`inline-flex items-center justify-center w-4 h-4 border border-emerald-500 rounded-sm p-[2px] bg-emerald-950/40 ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
      </span>
    );
  }

  return (
    <span
      title="Non-Vegetarian"
      className={`inline-flex items-center justify-center w-4 h-4 border border-rose-600 rounded-sm p-[2px] bg-rose-950/40 ${className}`}
    >
      <span
        className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-rose-600"
      ></span>
    </span>
  );
}

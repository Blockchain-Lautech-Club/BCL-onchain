"use client";

import React from "react";

export function FloatingBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Subtle Digital Grid Matrix */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      {/* Subtle Ambient Background Gradients (Static, No Glitter or Drifting Particles) */}
      <div className="absolute -top-40 right-[15%] w-[500px] h-[500px] rounded-full bg-[#0052ff]/10 blur-[140px]" />
      <div className="absolute top-[45%] -left-32 w-[500px] h-[500px] rounded-full bg-[#0052ff]/6 blur-[140px]" />
      <div className="absolute -bottom-32 right-[20%] w-[500px] h-[500px] rounded-full bg-[#00d26a]/5 blur-[150px]" />
    </div>
  );
}

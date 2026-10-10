"use client";
import React from "react";

export function FloatingBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-100" />
      {/* Orbs */}
      <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] rounded-full bg-accent/[0.05] blur-[120px] animate-orb-1" />
      <div className="absolute top-[30%] right-[5%] w-[400px] h-[400px] rounded-full bg-brand/[0.06] blur-[100px] animate-orb-2" />
      <div className="absolute bottom-[10%] left-[40%] w-[350px] h-[350px] rounded-full bg-accent-2/[0.04] blur-[90px]" />
    </div>
  );
}

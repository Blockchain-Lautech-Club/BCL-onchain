import { Suspense } from "react";
import { NavbarClient } from "./NavbarClient";

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 sticky top-0 z-50 navbar-glass border-b border-ink/[0.06]" />}>
      <NavbarClient />
    </Suspense>
  );
}
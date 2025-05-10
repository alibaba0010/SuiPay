"use client";

import { usePathname } from "next/navigation";
import { ProtectedRoute } from "./protected-route";

export function RouteChecker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProtectedRoute = !pathname.match(/^\/(|learn-more)$/);

  if (isProtectedRoute) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
  }

  return <>{children}</>;
}

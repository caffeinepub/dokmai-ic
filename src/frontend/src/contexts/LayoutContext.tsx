import { createContext, useContext, useEffect, useState } from "react";
import { useBreakpoint } from "../hooks/use-mobile";

interface LayoutContextValue {
  /** Sidebar open on mobile (overlay mode) */
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  /** Sidebar collapsed (icons-only) on tablet */
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  /** Current breakpoint */
  breakpoint: "mobile" | "tablet" | "desktop";
  /** Content marginLeft in px */
  contentMargin: number;
}

const LayoutContext = createContext<LayoutContextValue>({
  mobileOpen: false,
  setMobileOpen: () => {},
  collapsed: false,
  setCollapsed: () => {},
  breakpoint: "desktop",
  contentMargin: 264,
});

export function useLayoutContext() {
  return useContext(LayoutContext);
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const breakpoint = useBreakpoint();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Auto-manage collapsed state when breakpoint changes
  useEffect(() => {
    if (breakpoint === "mobile") {
      // On mobile: sidebar hidden by default
      setMobileOpen(false);
    } else if (breakpoint === "tablet") {
      // On tablet: always collapsed
      setCollapsed(true);
    } else {
      // On desktop: expanded
      setCollapsed(false);
    }
  }, [breakpoint]);

  // Close mobile sidebar on breakpoint upgrade
  useEffect(() => {
    if (breakpoint !== "mobile") {
      setMobileOpen(false);
    }
  }, [breakpoint]);

  const contentMargin =
    breakpoint === "mobile" ? 0 : breakpoint === "tablet" ? 72 : 264;

  return (
    <LayoutContext.Provider
      value={{
        mobileOpen,
        setMobileOpen,
        collapsed,
        setCollapsed,
        breakpoint,
        contentMargin,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

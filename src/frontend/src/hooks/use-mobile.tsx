import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);
  return isMobile;
}

/** Returns current breakpoint tier: "mobile" | "tablet" | "desktop" */
export function useBreakpoint(): "mobile" | "tablet" | "desktop" {
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">(() => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    if (w < 1024) return "mobile";
    if (w < 1280) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 1024) setBp("mobile");
      else if (w < 1280) setBp("tablet");
      else setBp("desktop");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return bp;
}

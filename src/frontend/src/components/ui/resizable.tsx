"use client";

import type * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

/**
 * Fintech-themed resizable handle.
 * Shows a thin dark line with a subtle neon-cyan vertical bar indicator.
 * On hover/focus: glows with neon cyan. Cursor changes to col-resize.
 */
function ResizableHandle({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle>) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        // Base: 6px wide hit target, no visible bg by default
        "relative flex w-1.5 shrink-0 cursor-col-resize select-none items-center justify-center",
        // Dark line background
        "bg-transparent",
        // Thin center line (via pseudo after)
        "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2",
        "after:bg-white/10 after:transition-colors after:duration-200",
        // On hover: line glows neon cyan
        "hover:after:bg-cyan-400/60 focus-visible:after:bg-cyan-400/80",
        // Drag indicator dot cluster
        "data-[panel-group-direction=vertical]:h-1.5 data-[panel-group-direction=vertical]:w-full",
        "data-[panel-group-direction=vertical]:cursor-row-resize",
        "data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-px",
        "data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0",
        "data-[panel-group-direction=vertical]:after:-translate-y-1/2",
        "focus-visible:outline-none",
        className,
      )}
      {...props}
    >
      {/* Visual drag indicator: 3 stacked dots */}
      <div
        className="
          z-10 flex flex-col items-center justify-center gap-[3px]
          pointer-events-none opacity-40
          transition-opacity duration-200
          group-hover:opacity-80
          [div[data-panel-resize-handle-enabled]]:hover:opacity-80
        "
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-0.5 h-0.5 rounded-full"
            style={{ background: "#22D3EE" }}
          />
        ))}
      </div>
    </ResizablePrimitive.PanelResizeHandle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };

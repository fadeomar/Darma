
"use client";

import React, { useEffect, useRef, useState, ReactNode } from "react";

interface Size {
  width: number;
  height: number;
}

interface ResizableContainerProps {
  children: ReactNode;
  onSizeChange?: (size: Size) => void;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

const ResizableContainer: React.FC<ResizableContainerProps> = ({
  children,
  onSizeChange,
  initialHeight = 600,
  minWidth = 320,
  minHeight = 240,
}) => {
  const [size, setSize] = useState<Size | null>(null);
  const [defaultSize, setDefaultSize] = useState<Size | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const innerLeftRef = useRef(0);
  const innerTopRef = useRef(0);

  useEffect(() => {
    if (!outerRef.current || defaultSize) return;
    const outer = outerRef.current;

    const setFromOuter = () => {
      const w = Math.floor(outer.clientWidth);
      if (w < minWidth) return;
      const newSize = { width: w, height: Math.max(minHeight, initialHeight) };
      setDefaultSize(newSize);
      setSize(newSize);
      onSizeChange?.(newSize);
    };

    setFromOuter();
    const ro = new ResizeObserver(setFromOuter);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [defaultSize, initialHeight, minHeight, minWidth, onSizeChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizingRef.current = true;
    if (innerRef.current) {
      const rect = innerRef.current.getBoundingClientRect();
      innerLeftRef.current = rect.left;
      innerTopRef.current = rect.top;
    }
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !defaultSize) return;
      const newWidth = Math.max(defaultSize.width, e.clientX - innerLeftRef.current);
      const newHeight = Math.max(defaultSize.height, e.clientY - innerTopRef.current);
      const newSize = { width: newWidth, height: newHeight };
      setSize(newSize);
      onSizeChange?.(newSize);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [defaultSize, onSizeChange]);

  const resetSize = () => {
    if (!defaultSize) return;
    setSize(defaultSize);
    onSizeChange?.(defaultSize);
  };

  const isDefault = defaultSize?.width === size?.width && defaultSize?.height === size?.height;

  return (
    <div ref={outerRef} className="w-full overflow-x-auto pb-2">
      <div
        ref={innerRef}
        className="relative inline-block rounded-[var(--radius-lg)] border border-[var(--color-preview-border)] bg-[var(--color-preview-bg-strong)] shadow-[var(--shadow-card)]"
        style={size ? { width: `${size.width}px`, height: `${size.height}px` } : undefined}
      >
        <div className="h-full w-full">{children}</div>

        <div
          className="absolute bottom-0 right-0 h-7 w-7 cursor-se-resize rounded-tl-[var(--radius-sm)] bg-[var(--color-surface-overlay)]"
          onMouseDown={handleMouseDown}
          aria-hidden
        >
          <div className="absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-[var(--color-primary)]" />
        </div>

        {!isDefault ? (
          <button
            type="button"
            className="absolute bottom-2 right-9 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] px-2 py-1 text-xs font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] transition hover:text-[var(--color-text-primary)]"
            onClick={resetSize}
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ResizableContainer;

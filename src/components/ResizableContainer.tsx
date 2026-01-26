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

  // ✅ Initialize from the real available width using ResizeObserver
  useEffect(() => {
    if (!outerRef.current || defaultSize) return;

    const outer = outerRef.current;

    const setFromOuter = () => {
      const w = Math.floor(outer.clientWidth);

      // If layout isn't ready yet, ignore tiny widths
      if (w < minWidth) return;

      const newSize = {
        width: w,
        height: Math.max(minHeight, initialHeight),
      };

      setDefaultSize(newSize);
      setSize(newSize);
      onSizeChange?.(newSize);
    };

    // Try immediately (sometimes works)
    setFromOuter();

    // Then observe until we get a real width
    const ro = new ResizeObserver(() => {
      setFromOuter();
    });

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

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current || !defaultSize) return;

    const newWidth = Math.max(
      defaultSize.width,
      e.clientX - innerLeftRef.current,
    );
    const newHeight = Math.max(
      defaultSize.height,
      e.clientY - innerTopRef.current,
    );

    const newSize = { width: newWidth, height: newHeight };
    setSize(newSize);
    onSizeChange?.(newSize);
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const resetSize = () => {
    if (!defaultSize) return;
    setSize(defaultSize);
    onSizeChange?.(defaultSize);
  };

  const isDefault =
    defaultSize?.width === size?.width && defaultSize?.height === size?.height;

  return (
    // ✅ OUTER: full width measuring area
    <div ref={outerRef} className="w-full">
      {/* ✅ INNER: actual resizable box (this is what should visually shrink/grow) */}
      <div
        ref={innerRef}
        className="relative bg-gray-200 border border-gray-300 inline-block rounded-[16px] shadow-xl"
        style={
          size
            ? { width: `${size.width}px`, height: `${size.height}px` }
            : undefined
        }
      >
        <div className="w-full h-full">{children}</div>

        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500 hover:border-blue-700" />
        </div>

        {!isDefault && (
          <button
            className="absolute bottom-1 right-1 bg-gray-600 text-white rounded px-2 py-1 text-xs hover:bg-gray-700 shadow-md transition-colors"
            onClick={resetSize}
          >
            Reset Size
          </button>
        )}
      </div>
    </div>
  );
};

export default ResizableContainer;

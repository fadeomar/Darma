"use client";
import React, { useState, useRef, useEffect, ReactNode } from "react";

interface Size {
  width: number;
  height: number;
}

interface ResizableContainerProps {
  children: ReactNode;
  onSizeChange?: (size: Size) => void;
}

const ResizableContainer: React.FC<ResizableContainerProps> = ({
  children,
  onSizeChange,
}) => {
  const [size, setSize] = useState<Size | null>(null);
  const [defaultSize, setDefaultSize] = useState<Size | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const parentLeftRef = useRef(0);
  const parentTopRef = useRef(0);

  useEffect(() => {
    if (childRef.current && parentRef.current && !defaultSize) {
      const { width, height } = childRef.current.getBoundingClientRect();
      const newSize = { width, height };
      setDefaultSize(newSize);
      setSize(newSize);
      if (onSizeChange) onSizeChange(newSize);
    }
  }, [children, onSizeChange, defaultSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    if (parentRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      parentLeftRef.current = rect.left;
      parentTopRef.current = rect.top;
    }
    e.preventDefault();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMouseMove = (e: MouseEvent) => {
    if (isResizingRef.current && parentRef.current && defaultSize) {
      const newWidth = Math.max(
        defaultSize.width,
        e.clientX - parentLeftRef.current
      );
      const newHeight = Math.max(
        defaultSize.height,
        e.clientY - parentTopRef.current
      );
      const newSize = { width: newWidth, height: newHeight };
      setSize(newSize);
      if (onSizeChange) onSizeChange(newSize);
    }
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
  }, [handleMouseMove, onSizeChange]);

  const resetSize = () => {
    if (defaultSize) {
      setSize(defaultSize);
      if (onSizeChange) onSizeChange(defaultSize);
    }
  };

  return (
    <div
      ref={parentRef}
      className="relative bg-gray-200 border border-gray-300 inline-block rounded-[16px] shadow-xl"
      style={
        size ? { width: `${size.width}px`, height: `${size.height}px` } : {}
      }
    >
      <div ref={childRef} className="w-full h-full">
        {children}
      </div>
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500 hover:border-blue-700" />
      </div>
      {!(
        defaultSize?.width === size?.width &&
        defaultSize?.height === size?.height
      ) && (
        <button
          className="absolute bottom-1 right-1 bg-gray-600 text-white rounded px-2 py-1 text-xs hover:bg-gray-700 shadow-md transition-colors"
          onClick={resetSize}
        >
          Reset Size
        </button>
      )}
    </div>
  );
};

export default ResizableContainer;

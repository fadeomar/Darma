import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import cn from "@/utils/cn";
import { shadowsArray, ShadowItem } from "@/data/shadowsData";
import { BoxShadowState, Shadow } from "@/types";

// Utility functions
const hexToRgba = (hex: string, opacity: number): string => {
  const hexValue = hex.replace("#", "");
  const r = parseInt(hexValue.slice(0, 2), 16);
  const g = parseInt(hexValue.slice(2, 4), 16);
  const b = parseInt(hexValue.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const getBoxShadowString = (shadows: Shadow[]): string => {
  return shadows
    .map(({ offsetX, offsetY, blur, spread, color, opacity, inset }) => {
      const rgba = hexToRgba(color, opacity);
      return `${
        inset ? "inset " : ""
      }${offsetX}px ${offsetY}px ${blur}px ${spread}px ${rgba}`;
    })
    .join(", ");
};

// Animation variants
const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

// Constants
const ITEMS_PER_ROW = 5;
const VISIBLE_ROWS = 3;
const ITEM_SIZE = 48;
const GAP = 16; // Increased from 12px to 16px
const BUFFER = 8; // Extra slide distance to avoid edge peeking
const CONTAINER_HEIGHT = VISIBLE_ROWS * ITEM_SIZE + (VISIBLE_ROWS - 1) * GAP; // 3 * 48 + 2 * 16 = 176px

interface ShadowSliderSectionProps {
  onShadowSelect: (state: BoxShadowState) => void;
  activeLightSource: number;
}

export default function ShadowSliderSection({
  onShadowSelect,
  activeLightSource,
}: ShadowSliderSectionProps) {
  const items = shadowsArray.boxShadows;
  const [currentRow, setCurrentRow] = useState(0);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const rows = useMemo(() => {
    const chunked: ShadowItem[][] = [];
    for (let i = 0; i < items.length; i += ITEMS_PER_ROW) {
      chunked.push(items.slice(i, i + ITEMS_PER_ROW));
    }
    return chunked;
  }, [items]);

  const totalRows = rows.length;
  const maxRow = Math.max(0, totalRows - VISIBLE_ROWS);
  const canSlideUp = currentRow > 0;
  const canSlideDown = currentRow < maxRow;

  const handleItemClick = useCallback(
    (item: ShadowItem) => {
      setSelectedItem(item.name);
      const newShadows: Shadow[] = item.shadows.map((shadow) => ({
        id: shadow.id, // Use existing id from shadowsData
        offsetX: shadow.offsetX,
        offsetY: shadow.offsetY,
        blur: shadow.blur,
        spread: shadow.spread,
        opacity: shadow.opacity,
        color: shadow.color,
        inset: shadow.inset,
        distance: shadow.distance || 10,
      }));

      onShadowSelect({
        shadows: newShadows,
        boxSize: shadowsArray.defaultState.boxSize,
        borderRadius: shadowsArray.defaultState.borderRadius,
        backgroundColor: shadowsArray.defaultState.backgroundColor,
        activeLightSource,
      });
    },
    [onShadowSelect, activeLightSource]
  );

  const handleSlideUp = () => setCurrentRow((prev) => Math.max(prev - 1, 0));
  const handleSlideDown = () =>
    setCurrentRow((prev) => Math.min(prev + 1, maxRow));

  return (
    <div className="w-full max-w-md mx-auto relative p-4">
      <div
        className="overflow-hidden rounded-lg bg-gray-50"
        style={{ height: `${CONTAINER_HEIGHT}px` }}
      >
        <motion.div
          className="flex flex-col"
          style={{ gap: `${GAP}px` }}
          animate={{ y: -currentRow * (ITEM_SIZE + GAP + BUFFER) }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          {rows.map((row, i) => (
            <motion.div
              key={i}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-5"
              style={{ gap: `${GAP}px`, height: `${ITEM_SIZE}px` }}
            >
              {row.map((item) => (
                <motion.div
                  key={item.name}
                  className={cn(
                    "flex items-center justify-center text-xs font-medium text-gray-700 cursor-pointer bg-white border-2 rounded-lg transition-all",
                    selectedItem === item.name
                      ? "border-blue-500"
                      : "border-transparent"
                  )}
                  style={{
                    width: `${ITEM_SIZE}px`,
                    height: `${ITEM_SIZE}px`,
                    boxShadow: getBoxShadowString(item.shadows),
                  }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: getBoxShadowString(
                      item.shadows.map((s) => ({ ...s, blur: s.blur + 10 }))
                    ),
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={selectedItem === item.name ? { scale: 1.1 } : {}}
                  transition={{ type: "spring", stiffness: 300 }}
                  variants={itemVariants}
                  onClick={() => handleItemClick(item)}
                >
                  {item.name.match(/\d+/)?.[0] || item.name}
                </motion.div>
              ))}
            </motion.div>
          ))}
        </motion.div>
      </div>
      <AnimatePresence>
        {canSlideUp && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition"
            onClick={handleSlideUp}
            aria-label="Slide up"
          >
            <ChevronUp className="w-5 h-5 text-gray-600" />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {canSlideDown && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition"
            onClick={handleSlideDown}
            aria-label="Slide down"
          >
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

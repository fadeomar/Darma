import { createDefaultGridState, createGridItem } from "./grid";
import type { GridGeneratorState, GridPreset } from "./types";

function makeState(partial: Partial<GridGeneratorState>): GridGeneratorState {
  return { ...createDefaultGridState(), ...partial };
}

export const GRID_PRESETS: GridPreset[] = [
  {
    id: "bento-grid",
    name: "Bento grid",
    description: "Mixed card sizes for modern landing pages and dashboards.",
    state: createDefaultGridState(),
  },
  {
    id: "three-column",
    name: "Basic 3-column",
    description: "Equal columns for feature cards, pricing, or content blocks.",
    state: makeState({
      columns: 3,
      rows: 2,
      columnTemplate: "repeat(3, minmax(0, 1fr))",
      rowTemplate: "repeat(2, minmax(140px, auto))",
      items: [
        createGridItem({ id: "card-1", name: "Card 1", areaName: "cardOne", columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 3, background: "#2563eb", content: "Card 1" }),
        createGridItem({ id: "card-2", name: "Card 2", areaName: "cardTwo", columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 3, background: "#7c3aed", content: "Card 2" }),
        createGridItem({ id: "card-3", name: "Card 3", areaName: "cardThree", columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 3, background: "#0f766e", content: "Card 3" }),
      ],
      selectedItemId: "card-1",
    }),
  },
  {
    id: "sidebar-layout",
    name: "Sidebar layout",
    description: "Classic sidebar and main content layout.",
    state: makeState({
      columns: 4,
      rows: 2,
      columnTemplate: "240px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
      rowTemplate: "auto minmax(300px, 1fr)",
      useTemplateAreas: true,
      items: [
        createGridItem({ id: "header", name: "Header", areaName: "header", columnStart: 1, columnEnd: 5, rowStart: 1, rowEnd: 2, background: "#1d4ed8", content: "Header" }),
        createGridItem({ id: "sidebar", name: "Sidebar", areaName: "sidebar", columnStart: 1, columnEnd: 2, rowStart: 2, rowEnd: 3, background: "#334155", content: "Sidebar" }),
        createGridItem({ id: "main", name: "Main", areaName: "main", columnStart: 2, columnEnd: 5, rowStart: 2, rowEnd: 3, background: "#059669", content: "Main content" }),
      ],
      selectedItemId: "main",
    }),
  },
  {
    id: "app-shell",
    name: "App shell",
    description: "Header, sidebar, content, and footer named areas.",
    state: makeState({
      columns: 4,
      rows: 4,
      columnTemplate: "220px repeat(3, minmax(0, 1fr))",
      rowTemplate: "72px repeat(2, minmax(150px, 1fr)) 72px",
      useTemplateAreas: true,
      items: [
        createGridItem({ id: "header", name: "Header", areaName: "header", columnStart: 1, columnEnd: 5, rowStart: 1, rowEnd: 2, background: "#4f46e5", content: "Header" }),
        createGridItem({ id: "sidebar", name: "Sidebar", areaName: "sidebar", columnStart: 1, columnEnd: 2, rowStart: 2, rowEnd: 4, background: "#0f172a", content: "Sidebar" }),
        createGridItem({ id: "content", name: "Content", areaName: "content", columnStart: 2, columnEnd: 5, rowStart: 2, rowEnd: 4, background: "#0d9488", content: "Content" }),
        createGridItem({ id: "footer", name: "Footer", areaName: "footer", columnStart: 1, columnEnd: 5, rowStart: 4, rowEnd: 5, background: "#9333ea", content: "Footer" }),
      ],
      selectedItemId: "content",
    }),
  },
  {
    id: "dashboard-cards",
    name: "Dashboard cards",
    description: "Metric cards, a wide chart, and a compact activity panel.",
    state: makeState({
      columns: 4,
      rows: 3,
      columnTemplate: "repeat(4, minmax(0, 1fr))",
      rowTemplate: "120px minmax(220px, 1fr) 140px",
      items: [
        createGridItem({ id: "metric-1", name: "Revenue", areaName: "revenue", columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2, background: "#2563eb", content: "Revenue" }),
        createGridItem({ id: "metric-2", name: "Orders", areaName: "orders", columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2, background: "#7c3aed", content: "Orders" }),
        createGridItem({ id: "metric-3", name: "Customers", areaName: "customers", columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2, background: "#0f766e", content: "Customers" }),
        createGridItem({ id: "activity", name: "Activity", areaName: "activity", columnStart: 4, columnEnd: 5, rowStart: 1, rowEnd: 4, background: "#ea580c", content: "Activity" }),
        createGridItem({ id: "chart", name: "Chart", areaName: "chart", columnStart: 1, columnEnd: 4, rowStart: 2, rowEnd: 4, background: "#111827", content: "Chart area" }),
      ],
      selectedItemId: "chart",
    }),
  },
  {
    id: "gallery",
    name: "Gallery grid",
    description: "Featured image with supporting gallery tiles.",
    state: makeState({
      columns: 4,
      rows: 3,
      columnTemplate: "repeat(4, minmax(0, 1fr))",
      rowTemplate: "repeat(3, 150px)",
      items: [
        createGridItem({ id: "featured", name: "Featured", areaName: "featured", columnStart: 1, columnEnd: 3, rowStart: 1, rowEnd: 3, background: "#be123c", content: "Featured" }),
        createGridItem({ id: "tile-1", name: "Tile 1", areaName: "tileOne", columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2, background: "#0891b2", content: "Tile" }),
        createGridItem({ id: "tile-2", name: "Tile 2", areaName: "tileTwo", columnStart: 4, columnEnd: 5, rowStart: 1, rowEnd: 2, background: "#7c2d12", content: "Tile" }),
        createGridItem({ id: "tile-3", name: "Tile 3", areaName: "tileThree", columnStart: 3, columnEnd: 5, rowStart: 2, rowEnd: 4, background: "#4f46e5", content: "Wide tile" }),
        createGridItem({ id: "tile-4", name: "Tile 4", areaName: "tileFour", columnStart: 1, columnEnd: 3, rowStart: 3, rowEnd: 4, background: "#166534", content: "Wide tile" }),
      ],
      selectedItemId: "featured",
    }),
  },
  {
    id: "custom",
    name: "Custom grid",
    description: "Start from a clean blank-ish layout with one item.",
    state: makeState({
      columns: 3,
      rows: 3,
      columnTemplate: "repeat(3, minmax(0, 1fr))",
      rowTemplate: "repeat(3, minmax(120px, auto))",
      items: [createGridItem({ id: "item-1", name: "Item 1", areaName: "itemOne", columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2, background: "#2563eb", content: "Item 1" })],
      selectedItemId: "item-1",
    }),
  },
];

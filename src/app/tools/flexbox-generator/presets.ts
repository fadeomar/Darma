import { createDefaultFlexState, createFlexItem } from "./flexbox";
import type { FlexPreset } from "./types";

const base = createDefaultFlexState();

export const FLEX_PRESETS: FlexPreset[] = [
  {
    id: "navbar",
    name: "Navbar",
    description: "Logo, navigation, search, and actions with responsive wrapping.",
    state: base,
  },
  {
    id: "centered-content",
    name: "Centered content",
    description: "Center one or more items on both axes.",
    state: {
      ...base,
      direction: "row",
      wrap: "nowrap",
      justifyContent: "center",
      alignItems: "center",
      minHeight: 360,
      items: [
        createFlexItem({ id: "center-card", name: "Centered card", content: "Centered card", flexBasis: "320px", background: "#4f46e5" }),
      ],
      selectedItemId: "center-card",
    },
  },
  {
    id: "wrapping-cards",
    name: "Wrapping cards",
    description: "Responsive cards that wrap to new rows as space changes.",
    state: {
      ...base,
      wrap: "wrap",
      justifyContent: "flex-start",
      alignItems: "stretch",
      alignContent: "flex-start",
      items: ["Analytics", "Orders", "Customers", "Revenue", "Tasks", "Alerts"].map((name, index) =>
        createFlexItem({
          id: `card-${index + 1}`,
          name,
          content: name,
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: "220px",
          background: ["#2563eb", "#0f766e", "#9333ea", "#ea580c", "#be123c", "#0f172a"][index],
        }),
      ),
      selectedItemId: "card-1",
    },
  },
  {
    id: "pricing-cards",
    name: "Pricing cards",
    description: "Equal width pricing cards with aligned heights.",
    state: {
      ...base,
      wrap: "wrap",
      justifyContent: "center",
      alignItems: "stretch",
      items: ["Starter", "Pro", "Business"].map((name, index) =>
        createFlexItem({
          id: `pricing-${index + 1}`,
          name,
          content: name,
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: "260px",
          background: ["#2563eb", "#7c3aed", "#0f766e"][index],
        }),
      ),
      selectedItemId: "pricing-1",
    },
  },
  {
    id: "media-object",
    name: "Media object",
    description: "Avatar or image beside flexible text content.",
    state: {
      ...base,
      wrap: "nowrap",
      justifyContent: "flex-start",
      alignItems: "center",
      items: [
        createFlexItem({ id: "avatar", name: "Avatar", content: "Image", flexBasis: "96px", width: "96px", height: "96px", background: "#4f46e5" }),
        createFlexItem({ id: "body", name: "Body", content: "Flexible content area", flexGrow: 1, flexShrink: 1, flexBasis: "0", background: "#0f766e" }),
      ],
      selectedItemId: "body",
    },
  },
  {
    id: "toolbar",
    name: "Toolbar",
    description: "Toolbar actions with one item pushed to the end using auto margin.",
    state: {
      ...base,
      justifyContent: "flex-start",
      alignItems: "center",
      items: [
        createFlexItem({ id: "filter", name: "Filter", content: "Filter", flexBasis: "110px", background: "#2563eb" }),
        createFlexItem({ id: "sort", name: "Sort", content: "Sort", flexBasis: "100px", background: "#0f766e" }),
        createFlexItem({ id: "export", name: "Export", content: "Export", flexBasis: "120px", marginLeftAuto: true, background: "#ea580c" }),
      ],
      selectedItemId: "export",
    },
  },
  {
    id: "vertical-stack",
    name: "Vertical stack",
    description: "Column layout with controlled spacing and stretch alignment.",
    state: {
      ...base,
      direction: "column",
      wrap: "nowrap",
      justifyContent: "flex-start",
      alignItems: "stretch",
      items: ["Header", "Content", "Actions"].map((name, index) =>
        createFlexItem({
          id: `stack-${index + 1}`,
          name,
          content: name,
          flexGrow: index === 1 ? 1 : 0,
          flexBasis: index === 1 ? "0" : "auto",
          background: ["#4f46e5", "#0f766e", "#ea580c"][index],
        }),
      ),
      selectedItemId: "stack-2",
    },
  },
  {
    id: "split-hero",
    name: "Split hero",
    description: "Text and visual area split across a responsive row.",
    state: {
      ...base,
      wrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 360,
      items: [
        createFlexItem({ id: "hero-copy", name: "Hero copy", content: "Hero copy", flexGrow: 1, flexBasis: "320px", background: "#4f46e5" }),
        createFlexItem({ id: "hero-visual", name: "Hero visual", content: "Visual", flexGrow: 1, flexBasis: "320px", height: "220px", background: "#0f766e" }),
      ],
      selectedItemId: "hero-copy",
    },
  },
];

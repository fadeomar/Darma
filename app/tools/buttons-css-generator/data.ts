import { getBoxShadowColor, getHoverColor } from "@/utils";

export const buttonGradients = [
  {
    degree: "315deg",
    color1: "#4ecdc4",
    p1: "0%",
    color2: "#c797eb",
    p2: "75%",
  },
  {
    degree: "315deg",
    color1: "#bdc3c7",
    p1: "0%",
    color2: "#2c3e50",
    p2: "75%",
  },
  {
    degree: "315deg",
    color1: "#f8b500",
    p1: "0%",
    color2: "#fceabb",
    p2: "75%",
  },
  {
    degree: "315deg",
    color1: "#43cea2",
    p1: "0%",
    color2: "#185a9d",
    p2: "75%",
  },
  {
    degree: "315deg",
    color1: "#000428",
    p1: "0%",
    color2: "#004e92",
    p2: "75%",
  },
  {
    degree: "315deg",
    color1: "#f0ecfc",
    p1: "0%",
    color2: "#c797eb",
    p2: "75%",
  },
  {
    degree: "315deg",
    color1: "#c02425",
    p1: "0%",
    color2: "#f0cb35",
    p2: "75%",
  },
  {
    degree: "315deg",
    color1: "#7b4397",
    p1: "0%",
    color2: "#dc2430",
    p2: "75%",
  },
  {
    degree: "315deg",
    color1: "#833ab4",
    p1: "0%",
    color2: "#fd1d1d",
    p2: "50%",
    color3: "#fcb045",
    position3: undefined, // position not explicitly defined in the CSS
  },
];

type shadowOption = {
  bgColor: string;
  hoverBgColor: string;
  shadowColor: string;
  textColor: string;
  hoverTextColor: string;
  hoverShadowColor: string;
};
export const _ColorsOptions: shadowOption[] = [
  {
    bgColor: "#ff6392",
    // hoverBgColor: "#ff85a8",
    hoverBgColor: getHoverColor("#ff6392"),
    // shadowColor: "#ff0a78",
    shadowColor: getBoxShadowColor("#ff6392"),
    textColor: "#ffffff",
    hoverTextColor: "#ffffff",
    hoverShadowColor: getBoxShadowColor(getHoverColor("#ff6392")),
  },
  {
    bgColor: "#3d348b",
    hoverBgColor: "#5a50a8",
    // shadowColor: "#2c0b8e",
    shadowColor: getBoxShadowColor("#3d348b"),
    textColor: "#ffffff",
    hoverTextColor: "#ffffff",
    hoverShadowColor: getBoxShadowColor(getHoverColor("#3d348b")),
  },
  {
    bgColor: "#3a86ff",
    hoverBgColor: "#609cff",
    // shadowColor: "#4433ff",
    shadowColor: getBoxShadowColor("#3a86ff"),
    textColor: "#ffffff",
    hoverTextColor: "#ffffff",
    hoverShadowColor: getBoxShadowColor(getHoverColor("#3a86ff")),
  },
  {
    bgColor: "#ef233c",
    hoverBgColor: "#f24c61",
    // shadowColor: "#d90429",
    shadowColor: getBoxShadowColor("#ef233c"),
    textColor: "#ffffff",
    hoverTextColor: "#ffffff",
    hoverShadowColor: getBoxShadowColor(getHoverColor("#ef233c")),
  },
  {
    bgColor: "#80ed99",
    hoverBgColor: "#a3f2b3",
    // shadowColor: "#57cc99",
    shadowColor: getBoxShadowColor("#80ed99"),
    textColor: "#343a40",
    hoverTextColor: "#343a40",
    hoverShadowColor: getBoxShadowColor(getHoverColor("#80ed99")),
  },
  {
    bgColor: "#ffe566",
    hoverBgColor: "#ffea8c",
    // shadowColor: "#ffd819",
    shadowColor: getBoxShadowColor("#ffe566"),
    textColor: "#343a40",
    hoverTextColor: "#343a40",
    hoverShadowColor: getBoxShadowColor(getHoverColor("#ffe566")),
  },
  {
    bgColor: "#ced4da",
    hoverBgColor: "#dde1e6",
    // shadowColor: "#adb5bd",
    shadowColor: getBoxShadowColor("#ced4da"),
    textColor: "#343a40",
    hoverTextColor: "#343a40",
    hoverShadowColor: getBoxShadowColor(getHoverColor("#ced4da")),
  },
  {
    bgColor: "#6c757d",
    hoverBgColor: "#8d959c",
    // shadowColor: "#495057",
    shadowColor: getBoxShadowColor("#6c757d"),
    textColor: "#ffffff",
    hoverTextColor: "#ffffff",
    hoverShadowColor: getBoxShadowColor(getHoverColor("#6c757d")),
  },
  {
    bgColor: "#343a40",
    hoverBgColor: "#53585f",
    // shadowColor: "#212529",
    shadowColor: getBoxShadowColor("#343a40"),
    textColor: "#ffffff",
    hoverTextColor: "#ffffff",
    hoverShadowColor: getBoxShadowColor(getHoverColor("#343a40")),
  },
];

// Define props for ShadowsDInputs

import { Dispatch, SetStateAction } from "react";

// Define the state interface
export interface State {
  defaultHoverBgColor: string;
  defaultBgColor: string;
  defaultShadowColor: string;
  textPlaceholder: string;
  defaultTextColor: string;
  defaultHoverShadowColor: string;
  defaultHoverTextColor: string;
  defaultColor1: string;
  defaultColor2: string;
  bgColor: string;
  shadowColor: string;
  textColor: string;
  size: number;
  radius: number;
  fontSize: string;
  hoverBgColor: string;
  hoverShadowColor: string;
  hoverTextColor: string;
  degree: string;
  p1: string;
  color1: string;
  color2: string;
  p2: string;
  variant: string;
  slideDirection: string;
  easing: string;
}

export interface ShadowsDInputsProps {
  state: State;
  setState: Dispatch<SetStateAction<State>>;
}

export type VariantCheck = string | string[];

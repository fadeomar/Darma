import { State } from "@/types/buttonGeneratorTypes";
import { hexToRGB } from "@/utils";

const baseStyles = ({
  size,
  radius,
  textColor,
  bgColor,
  fontSize,
}: State) => `min-width: ${size}px;
height: ${Math.round(Math.min(size ? size / 3.25 : 40, 60))}px;
color: ${textColor};
padding: 5px 10px;
font-weight: bold;
font-size: ${fontSize};
cursor: pointer;
transition: all 0.3s ease;
position: relative;
display: inline-block;
outline: none;
border-radius: ${radius}px;
border: none;
background: ${bgColor};
overflow: hidden;`;
const baseHoverStyle = (state: State) => {
  return `background: ${state.hoverBgColor};
    color: ${state.hoverTextColor};`;
};
const commonShadow = (color: string | undefined) => {
  console.log({ color });
  const rgbColor = color
    ? `${hexToRGB(color).r},${hexToRGB(color).g},${hexToRGB(color).b}`
    : `0,0,0`;
  return `box-shadow: inset 2px 2px 2px 0px rgba(255,255,255,.5), 7px 7px 20px 0px rgba(${rgbColor},.1), 4px 4px 5px 0px rgba(${rgbColor},.1) !important;`;
};

const slidingLayerStyle = (state: State) => {
  const commonStyles = `
    border-radius: 5px;
    position: absolute;
    content: "";
    width: 110%;
    height: 110%;
    z-index: -1;
    ${commonShadow(state.shadowColor)}
    transition: all 0.3s ease;
    background-color: ${state.hoverBgColor};
  `;

  switch (state.slideDirection) {
    case "right":
      return `.darma-button:after {
          ${commonStyles}
          top: -5px;
          transform: translateX(100%);
          right: -5px;
        }
        .darma-button:hover:after {
          transform: translateX(0);
        }
      `;
    case "left":
      return `.darma-button:after {
          ${commonStyles}
          top: -5px;
          transform: translateX(-100%);
          left: 0;
        }
        .darma-button:hover:after {
          transform: translateX(0);
        }
      `;
    case "top":
      return `.darma-button:after {
          ${commonStyles}
          left: -5px;
          transform: translateY(-100%);
          top: 0;
        }
        .darma-button:hover:after {
          transform: translateY(0);
        }
      `;
    case "bottom":
      return `.darma-button:after {
          ${commonStyles}
          left: -5px;
          transform: translateY(100%);
          bottom: 0;
        }
        .darma-button:hover:after {
          transform: translateY(0);
        }
      `;
    default:
      return ""; // Fallback if no direction is set
  }
};

export const handleStyle = (state: State) => {
  // Shadow styles reused by shadow-border and sliding variants

  // Variant-specific styles
  let styles;
  switch (state.variant) {
    case "3d":
      styles = `.darma-button {
    min-width: ${state.size}px;
    display: inline-block;
    max-width: 100%;
    height: ${state.size ? state.size / 2.5 : 40}px;
    max-height: 64px;
    color: ${state.textColor};
    padding: 5px 10px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ${state.easing};
    position: relative;
    outline: none;
    border-radius: ${state.radius}px;
    border: none;
    background: ${state.bgColor};
    box-shadow: 0 5px ${state.shadowColor};
    font-size: ${state.fontSize};
  }

  .darma-button:hover {
    box-shadow: 0 3px ${state.hoverShadowColor};
    top: 1px;
    ${baseHoverStyle(state)}
  }

  .darma-button:active {
    box-shadow: 0 2px ${state.shadowColor};
    top: -2px;
  }
`;
      break;
    case "retro":
      styles = `.darma-button {
    min-width: ${state.size}px;
height: ${Math.round(Math.min(state.size ? state.size / 3.25 : 40, 60))}px;
  color: ${state.textColor};
  padding: 5px 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: inline-block;
  outline: none;
  border: 1px solid ${state.shadowColor};
  background: transparent;
  z-index: 0;
}

.darma-button:hover {
  border: 1px solid ${state.hoverShadowColor};
  color: ${state.hoverTextColor};

}
.darma-button:hover:after {
  top: 0;
  left: 0;
  background-color: ${state.hoverBgColor};

}
.darma-button:after {
  content: "";
  width: 100%;
  z-index: -1;
  position: absolute;
  height: 100%;
  top: 5px;
  left: 5px;
  transition: 0.2s;
  background-color: ${state.bgColor};
}`;
      break;
    case "shadow-border":
      styles = `.darma-button {
        ${baseStyles(state)}
        ${commonShadow(state.shadowColor)}
      }
      .darma-button:hover {
    ${baseHoverStyle(state)}
      }
      .darma-button:active {
        top: 2px;
        ${commonShadow(state.hoverShadowColor)}

      }
    `;
      break;

    case "glow":
      styles = `.darma-button {
          ${baseStyles(state)}
          box-shadow: 0 0 10px ${state.shadowColor};
        }
        .darma-button:hover {
          box-shadow: 0 0 20px ${state.hoverShadowColor};
          background: ${state.hoverBgColor};
          color: ${state.hoverTextColor};
        }
        .darma-button:active {
          top: 2px;
        }
      `;
      break;
    case "shadow-on-click":
      styles = `.darma-button {
        ${baseStyles(state)}
        box-shadow: 0 3px 1px -2px ${state.shadowColor}, 0 2px 2px 0 ${
        state.shadowColor
      }, 0 1px 5px 0 ${state.shadowColor};
      }
      .darma-button:active {
        box-shadow: 0 4px 2px -3px ${state.shadowColor}, 0 4px 5px 1px ${
        state.shadowColor
      }, 0 2px 7px 1px ${state.shadowColor} !important;
      }
      .darma-button:hover {
    ${baseHoverStyle(state)}
      }
      div:has(> .darma-button) {
  background: white;
}
    `;
      break;
    case "sliding":
      styles = `.darma-button {
        ${baseStyles(state)}
        ${commonShadow(state.shadowColor)}
        z-index: 1;
      }
      ${slidingLayerStyle(state)}
      .darma-button:active {
        top: 2px;
      }

      .darma-button:hover {
      color: ${state.hoverTextColor};
        ${commonShadow(state.hoverShadowColor)}

      }
    `;
      break;

    case "outline":
      styles = `.darma-button {
            ${baseStyles(state)}
            background: transparent;
            border: 2px solid ${state.bgColor};
          }
          .darma-button:hover {
            background: ${state.hoverBgColor};
            color: ${state.hoverTextColor};
          }
          .darma-button:active {
            top: 2px;
          }
        `;
      break;
    case "arrow":
      styles = `.darma-button {
        ${baseStyles(state)}
      }
      .darma-button:hover {
        padding-right: 24px;
        padding-left: 8px;
          ${baseHoverStyle(state)}
      }
      .darma-button:hover:after {
        opacity: 1;
        right: 10px;
      }
      .darma-button:after {
        content: "\\00BB";
        position: absolute;
        opacity: 0;
        font-size: 20px;
        top: 50%;
        transform: translateY(-50%); 
        right: -20px;
        transition: 0.4s;
      }
    `;
      break;
    case "gradients":
      styles = `.darma-button {
            width: ${state.size}px;
            min-width: 100px;
            height: ${state.size ? state.size / 2.5 : 40}px;
            max-height: 64px;
            color: ${state.textColor};
            padding: 5px 10px;
            font-weight: bold;
            font-size: ${state.fontSize};
            cursor: pointer;
            transition: all 0.3s ${state.easing};
            position: relative;
            display: inline-block;
            outline: none;
            border-radius: ${state.radius}px;
            border: none;
            background-size: 120% auto;
            background-image: linear-gradient(${state.degree}, ${
        state.color1
      } ${state.p1}, ${state.color2} ${state.p2});
          }
          .darma-button:hover {
            background-position: right center;
          }
          .darma-button:active {
            top: 2px;
          }
        `;
      break;
    case "transition-on-hover":
      styles = `.darma-button {
            ${baseStyles(state)}
            background: transparent;
            border: 2px solid ${state.bgColor};
            color: ${state.textColor};
            z-index: 1;
          }
          ${slidingLayerStyle(state)}
          .darma-button:hover {
            color: ${state.hoverTextColor};
          }
          .darma-button:active {
            top: 2px;
          }
        `;
      break;
    default:
      styles = `.darma-button {
            ${baseStyles(state)}
          }
        `;
  }

  return styles;
};

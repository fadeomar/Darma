import { State } from "@/types/animatedBackgroundTypes";

const baseStyles = (state: State) => `
  .animated-background {
    position: absolute;
    width: 100%;
    height: 100%;
    background: ${
      state.backgroundColor === "transparent"
        ? "transparent"
        : state.backgroundColor
    };
    overflow: hidden;
  }
`;

const generateParticles = (state: State) => {
  let particles = "";
  const particleCount = state.particleCount || 20;

  for (let i = 1; i <= particleCount; i++) {
    const colorIndex = i % state.colors.length;
    particles += `
      .animated-background span:nth-child(${i}) {
        background: ${state.colors[colorIndex]};
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        animation-duration: ${
          parseInt(state.animationDuration) * (0.5 + Math.random())
        }s;
        animation-delay: -${Math.random() * parseInt(state.animationDuration)}s;
        transform-origin: ${Math.random() * 30 - 15}vw ${
      Math.random() * 30 - 15
    }vh;
        box-shadow: ${Math.random() > 0.5 ? "" : "-"}40vmin 0 ${
      5 + Math.random() * 2
    }vmin currentColor;
      }
    `;
  }

  return particles;
};

const generateBubbles = (state: State) => {
  let bubbles = "";
  const particleCount = state.particleCount || 10;

  for (let i = 0; i < particleCount; i++) {
    const colorIndex = i % state.colors.length;
    const size = 10 + Math.random() * 50;
    bubbles += `
      .animated-background li:nth-child(${i + 1}) {
        left: ${Math.random() * 100}%;
        width: ${size}px;
        height: ${size}px;
        bottom: 0;
        background: ${state.colors[colorIndex]};
        animation-delay: ${Math.random() * 10}s;
      }
    `;
  }

  return bubbles;
};

const generateExplosions = (state: State) => {
  let explosions = "";
  const particleCount = state.particleCount || 14;

  for (let i = 0; i < particleCount; i++) {
    const colorIndex = i % state.colors.length;
    explosions += `
      .animated-background li:nth-child(${i + 1}) {
        left: 50%;
        top: 50%;
        background: ${state.colors[colorIndex]};
        animation-delay: ${i * 0.5}s;
      }
    `;
  }

  return explosions;
};

export const handleBackgroundStyle = (state: State) => {
  const shapeStyles: Record<string, string> = {
    circle: `border-radius: 50%;`,
    square: `border-radius: 0;`,
    triangle: `
      width: 0;
      height: 0;
      background: transparent;
      border-left: calc(${state.particleSize} / 2) solid transparent;
      border-right: calc(${state.particleSize} / 2) solid transparent;
      border-bottom: ${state.particleSize} solid currentColor;
    `,
  };

  const particleShape = state.particleShape || "circle";
  const animationTiming = state.animationTiming || "linear";

  switch (state.variant) {
    case "particles":
      return `
        ${baseStyles(state)}
        @keyframes move {
          100% {
            transform: translate3d(0, 0, 1px) rotate(360deg);
          }
        }

        .animated-background span {
          width: ${state.particleSize};
          height: ${state.particleSize};
          ${shapeStyles[particleShape]}
          position: absolute;
          animation: move ${
            state.animationDuration
          } ${animationTiming} infinite;
        }

        ${generateParticles(state)}
      `;

    case "bubbles":
      return `
        ${baseStyles(state)}
        @keyframes animate {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
            ${shapeStyles[particleShape]}
          }
          100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: ${state.fadeOut ? 0 : 1};
            border-radius: ${
              state.morphToCircle
                ? "50%"
                : shapeStyles[particleShape].includes("border-radius")
                ? shapeStyles[particleShape].match(
                    /border-radius:\s*([^;]+)/
                  )?.[1] || "0"
                : "0"
            };
          }
        }

        .animated-background li {
          position: absolute;
          list-style: none;
          width: ${state.particleSize};
          height: ${state.particleSize};
          ${shapeStyles[particleShape]}
          animation: animate ${state.animationDuration} linear infinite;
        }

        ${generateBubbles(state)}
      `;

    case "explosion":
      return `
        ${baseStyles(state)}
        @keyframes cube {
          from {
            transform: scale(0) rotate(0deg) translate(-50%, -50%);
            opacity: 1;
          }
          to {
            transform: scale(${
              state.maxScale || 20
            }) rotate(960deg) translate(-50%, -50%);
            opacity: 0;
          }
        }

        .animated-background li {
          position: absolute;
          width: ${state.particleSize};
          height: ${state.particleSize};
          ${shapeStyles[particleShape]}
          transform-origin: center;
          animation: cube ${
            state.animationDuration
          } ${animationTiming} forwards infinite;
        }

        ${generateExplosions(state)}
      `;

    case "custom":
      return `
        ${baseStyles(state)}
        @keyframes move {
          100% {
            transform: translate3d(0, 0, 1px) rotate(360deg);
            opacity: ${state.opacity || 0.8};
          }
        }

        .animated-background span {
          width: ${state.particleSize};
          height: ${state.particleSize};
          ${shapeStyles[particleShape]}
          position: absolute;
          animation: move ${
            parseInt(state.animationDuration) * (state.speed || 1)
          }s ${animationTiming} infinite;
        }

        ${generateParticles(state)}
      `;

    default:
      return baseStyles(state);
  }
};

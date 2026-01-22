import React, { MouseEvent } from "react";

interface ShapeSwitcherProps {
  shape: number;
  setShape: (e: MouseEvent<HTMLButtonElement>) => void;
}

const ShapeSwitcher: React.FC<ShapeSwitcherProps> = ({ shape, setShape }) => {
  return (
    <>
      <div className="row row--label">
        <label className="opacity-60">Shape </label>
      </div>
      <div className="row">
        <div className="shape-switch">
          <button
            className={`flex justify-center items-center ${
              shape === 0 ? "active" : ""
            }`}
            onClick={setShape}
            name="flat"
            title="Flat"
            data-shape="0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="145"
              height="24"
              viewBox="0 0 145 24"
            >
              <defs>
                <linearGradient
                  id="animatedStrokeGradient"
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                >
                  <stop offset="0%" stopColor="#3B82F6">
                    <animate
                      attributeName="stop-color"
                      values="#3B82F6;#10B981;#EC4899;#3B82F6"
                      dur="6s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="100%" stopColor="#EC4899">
                    <animate
                      attributeName="stop-color"
                      values="#EC4899;#3B82F6;#10B981;#EC4899"
                      dur="6s"
                      repeatCount="indefinite"
                    />
                  </stop>
                </linearGradient>

                <linearGradient
                  id="animatedFillGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2">
                    <animate
                      attributeName="stop-color"
                      values="#3B82F6;#10B981;#EC4899"
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="100%" stopColor="#EC4899" stopOpacity="0.2">
                    <animate
                      attributeName="stop-color"
                      values="#EC4899;#3B82F6;#10B981"
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </stop>
                </linearGradient>
              </defs>

              <path
                d="M0 22H7C15.2843 22 22 15.2843 22 7.00001V3C22 2.44772 22.4477 2 23 2H121C121.552 2 122 2.44772 122 3V7.00001C122 15.2843 128.716 22 137 22H145"
                fill="url(#animatedFillGradient)"
              />

              <path
                d="M0 22H7C15.2843 22 22 15.2843 22 7.00001V3C22 2.44772 22.4477 2 23 2H121C121.552 2 122 2.44772 122 3V7.00001C122 15.2843 128.716 22 137 22H145"
                stroke="url(#animatedStrokeGradient)"
                strokeWidth="6"
                fill="none"
              />
            </svg>
          </button>
          <button
            className={`flex justify-center items-center ${
              shape === 1 ? "active" : ""
            }`}
            onClick={setShape}
            name="concave"
            title="Concave"
            data-shape="1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="145"
              height="24"
              viewBox="0 0 145 24"
            >
              <defs>
                <linearGradient
                  id="horizontalWave"
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                >
                  <stop offset="0%" stopColor="#8B5CF6">
                    <animate
                      attributeName="stop-color"
                      values="#8B5CF6;#EC4899;#3B82F6;#8B5CF6"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="100%" stopColor="#3B82F6">
                    <animate
                      attributeName="stop-color"
                      values="#3B82F6;#8B5CF6;#EC4899;#3B82F6"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                  </stop>
                </linearGradient>
              </defs>

              <path
                d="M0 2H22V21C22 21.5523 22.4477 22 23 22H121C121.552 22 122 21.5523 122 21V2H145"
                stroke="url(#horizontalWave)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="square"
              />
            </svg>
          </button>
          <button
            className={`flex justify-center items-center ${
              shape === 2 ? "active" : ""
            }`}
            onClick={setShape}
            name="convex"
            title="Convex"
            data-shape="2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="145"
              height="33"
              viewBox="0 0 145 33"
            >
              <defs>
                <linearGradient
                  id="animatedGradient"
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                >
                  <stop offset="0%" stopColor="#4F46E5">
                    <animate
                      attributeName="stop-color"
                      values="#4F46E5;#EC4899;#4F46E5"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="50%" stopColor="#EC4899">
                    <animate
                      attributeName="stop-color"
                      values="#EC4899;#F59E0B;#EC4899"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="100%" stopColor="#F59E0B">
                    <animate
                      attributeName="stop-color"
                      values="#F59E0B;#4F46E5;#F59E0B"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                  </stop>
                </linearGradient>
              </defs>

              <path
                d="M0 31H7C15.2843 31 22 24.2843 22 16V11.7329C22 11.2966 22.2898 10.9083 22.7061 10.7779C60.0722 -0.924818 84.913 -0.925978 121.302 10.7745C121.714 10.9071 122 11.2935 122 11.727V16C122 24.2843 128.716 31 137 31H145"
                fill="url(#animatedGradient)"
                fillRule="evenodd"
              />
            </svg>
          </button>
          <button
            className={`flex justify-center items-center ${
              shape === 3 ? "active" : ""
            }`}
            onClick={setShape}
            name="pressed"
            title="Pressed"
            data-shape="3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="145"
              height="24"
              viewBox="0 0 145 24"
            >
              <defs>
                <linearGradient
                  id="animatedWaveGradient"
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                >
                  <stop offset="0%" stopColor="#3B82F6">
                    <animate
                      attributeName="stop-color"
                      values="#3B82F6;#10B981;#EC4899;#3B82F6"
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="100%" stopColor="#EC4899">
                    <animate
                      attributeName="stop-color"
                      values="#EC4899;#3B82F6;#10B981;#EC4899"
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </stop>
                </linearGradient>
              </defs>

              <path
                d="M0 12h7c8.284 0 15-6.716 15-15v-3.607c0-.684.681-1.163 1.33-.948 35.876 11.871 62.446 10.46 97.37-.05.644-.194 1.3.284 1.3.956v3.649c0 8.284 6.716 15 15 15h7v12H0z"
                fill="url(#animatedWaveGradient)"
                fillRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default ShapeSwitcher;

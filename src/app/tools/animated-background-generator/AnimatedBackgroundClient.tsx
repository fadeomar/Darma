"use client";

import React, { CSSProperties, useState } from "react";
import Preview from "./Preview";
import Configuration from "./Configuration";
import VariantSelector from "@/components/VariantSelector";
import Title from "@/components/Title";
import CodeEditor from "@/components/CodeEditor";
import { State } from "@/types/animatedBackgroundTypes";
import { handleBackgroundStyle } from "./styles";

const defaultParticleState: State = {
  variant: "particles",
  particleCount: 20,
  particleSize: "10vmin",
  animationDuration: "45s",
  colors: ["#E45A84", "#FFACAC", "#583C87"],
  backgroundColor: "#3E1E68",
  particleShape: "circle",
  animationTiming: "linear",
  animationType: "rotate",
};

const defaultBubbleState: State = {
  variant: "bubbles",
  particleCount: 10,
  particleSize: "10vmin",
  animationDuration: "19s",
  colors: ["rgba(255, 255, 255, 0.2)"],
  backgroundColor: "#4e54c8",
  particleShape: "circle",
  animationTiming: "linear",
  animationType: "float-up",
  morphToCircle: true,
};

const defaultExplosionState: State = {
  variant: "explosion",
  particleCount: 14,
  particleSize: "10px",
  animationDuration: "7s",
  colors: ["#0039ad", "#0046d4"],
  backgroundColor: "#0040C1",
  particleShape: "circle",
  animationTiming: "ease-in",
  animationType: "explode",
  maxScale: 20,
};

const defaultCustomState: State = {
  variant: "custom",
  particleCount: 30,
  particleSize: "15px",
  animationDuration: "10s",
  colors: ["#00ff99", "#ff0066"],
  backgroundColor: "#222222",
  particleShape: "circle",
  animationTiming: "ease",
  animationType: "rotate",
  opacity: 0.8,
  speed: 1,
};

const defaultState: State = defaultParticleState;

export default function AnimatedBackgroundClient() {
  const [state, setState] = useState<State>(defaultState);

  const handleVariantSelect = (value: string) => {
    switch (value) {
      case "particles":
        setState(defaultParticleState);
        break;
      case "bubbles":
        setState(defaultBubbleState);
        break;
      case "explosion":
        setState(defaultExplosionState);
        break;
      case "custom":
        setState(defaultCustomState);
        break;
      default:
        setState(defaultParticleState);
    }
  };

  // Apply animation styles to body
  const bodyStyles = `
    body {
      background: ${state.backgroundColor};
      min-height: 100vh;
      margin: 0;
      overflow-x: hidden;
    }
    ${handleBackgroundStyle(state)}
  `;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
      <style>{bodyStyles}</style>

      {/* Hero Section */}
      <section className="text-center mb-12 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Animated Background Generator
        </h1>
        <p className="text-lg sm:text-xl text-gray-200">
          Craft stunning CSS animated backgrounds with particles, bubbles, or
          explosions. Customize and copy the code for your website or project!
        </p>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Preview and Code */}
          <div className="flex-1 bg-white bg-opacity-90 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <VariantSelector
              label="Select Background Variant"
              variants={["particles", "bubbles", "explosion", "custom"]}
              selected={state.variant}
              handleSelect={handleVariantSelect}
            />
            <Title
              variant="h4"
              as="h2"
              label="Preview"
              style={{ "--angle": "90deg" } as CSSProperties}
              className="my-6 text-gray-900"
            />
            <Preview state={state} />
            <Title
              variant="h4"
              as="h2"
              label="Generated Code"
              style={{ "--angle": "90deg" } as CSSProperties}
              className="my-6 text-gray-900"
            />
            <CodeEditor
              code={`<div class="animated-background"></div>\n<style>\n${handleBackgroundStyle(
                state
              )}\n</style>`}
              language="html"
              showCopyButton
              setCode={() => {}}
            />
          </div>

          {/* Configuration */}
          <div className="flex-1 bg-white bg-opacity-90 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <Configuration state={state} setState={setState} />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="w-full max-w-4xl mx-auto mt-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          About Our Animated Background Generator 🎨
        </h2>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
          <article className="bg-white bg-opacity-90 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start">
              <span className="text-3xl mr-3">✨</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  What is This Tool?
                </h3>
                <p className="mt-2 text-gray-600">
                  Our free Animated Background Generator creates dynamic CSS
                  backgrounds with particles, bubbles, or explosions. Customize
                  colors, shapes, and animations, then copy the code for your
                  project.
                </p>
              </div>
            </div>
          </article>

          <article className="bg-white bg-opacity-90 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start">
              <span className="text-3xl mr-3">🎥</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  What Does It Do?
                </h3>
                <p className="mt-2 text-gray-600">
                  Generate stunning animated backgrounds with customizable
                  settings. Choose from particle rotations, floating bubbles, or
                  explosive effects, and tweak particle count, size, colors, and
                  more.
                </p>
              </div>
            </div>
          </article>

          <article className="bg-white bg-opacity-90 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start">
              <span className="text-3xl mr-3">💻</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  When to Use It?
                </h3>
                <ul className="mt-2 list-disc list-inside text-gray-600 space-y-1">
                  <li>
                    Add engaging backgrounds to website headers or sections.
                  </li>
                  <li>Enhance presentations with dynamic visual effects.</li>
                  <li>Create eye-catching landing pages or portfolios.</li>
                  <li>Design animated overlays for videos or apps.</li>
                  <li>
                    Experiment with CSS animations for learning or prototyping.
                  </li>
                </ul>
              </div>
            </div>
          </article>

          <article className="bg-white bg-opacity-90 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start">
              <span className="text-3xl mr-3">🚀</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Why Choose Our Tool?
                </h3>
                <ul className="mt-2 list-disc list-inside text-gray-600 space-y-1">
                  <li>
                    <strong>100% Free</strong>: No costs or subscriptions.
                  </li>
                  <li>
                    <strong>Customizable</strong>: Fine-tune every aspect of
                    your animation.
                  </li>
                  <li>
                    <strong>Easy to Use</strong>: Intuitive controls for all
                    skill levels.
                  </li>
                  <li>
                    <strong>Instant Preview</strong>: See changes in real-time.
                  </li>
                  <li>
                    <strong>Copy & Paste</strong>: Ready-to-use CSS code for
                    your project.
                  </li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

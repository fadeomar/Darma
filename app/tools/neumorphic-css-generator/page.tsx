"use client";
import React, { useState, useRef } from "react";

import Preview from "./Preview";
import Configuration from "./Configuration";
import "./style.css";
import NeumorphismArticle from "./NeumorphismArticle";
const App = () => {
  const [activeLightSource, setActiveLightSource] = useState(1);
  const previewBox = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="w-full">
        <div className="container mx-auto">
          <div className="mx-auto flex-custom">
            <Preview
              setActiveLightSource={setActiveLightSource}
              previewBox={previewBox}
              activeLightSource={activeLightSource}
            />
            <Configuration
              previewBox={previewBox}
              activeLightSource={activeLightSource}
            />
          </div>
        </div>

        <div className="container max-w-screen-lg px-2 mx-auto mt-24">
          <section className="mb-24 text-left">
            <NeumorphismArticle />
          </section>
        </div>
      </div>
    </>
  );
};

export default App;

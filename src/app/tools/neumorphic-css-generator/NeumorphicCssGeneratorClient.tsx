"use client";
import React, { useState, useRef } from "react";

import Preview from "./Preview";
import Configuration from "./Configuration";

const App = () => {
  const [activeLightSource, setActiveLightSource] = useState(1);
  const previewBox = useRef<HTMLDivElement>(null);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
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
  );
};

export default App;

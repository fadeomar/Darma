"use client"; // Required for client-side interactivity

import React, { useEffect } from "react";

const ShapeCard = ({ id, HTML, CSS, JS }) => {
  const handleCopyHTML = () => {
    navigator.clipboard.writeText(HTML).then(() => {
      alert("HTML code copied to clipboard!");
    });
  };

  const handleCopyCSS = () => {
    navigator.clipboard.writeText(CSS).then(() => {
      alert("CSS code copied to clipboard!");
    });
  };
  useEffect(() => {
    // Execute the JS code inside the component
    const script = document.createElement("script");
    script.innerHTML = JS;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // Cleanup script on unmount
    };
  }, [JS]);

  return (
    <>
      <style>{CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: HTML }}></div>
      <button onClick={handleCopyHTML}>Copy HTML</button>
      <button onClick={handleCopyCSS}>Copy CSS</button>
    </>
  );
};

export default ShapeCard;

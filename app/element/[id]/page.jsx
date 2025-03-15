"use client";
import React from "react";
import elements from "../../../data/elements.json";

export default async function PreviewPage({ params }) {
  // Access params.id directly
  const { id } = await params;

  // Find the element by ID
  const element1 = elements.elements.find((el) => el.id === id);

  // Handle the case where the element is not found
  if (!element1) {
    return <p>Element not found!</p>;
  }

  // Generate the full HTML for the iframe
  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>body{display: flex; justify-content: center; align-items: center;height: 100dvh;} ${
        element1.css
      }</style>
    </head>
    <body>
      ${element1.html}
      <script>${element1.js || ""}</script>
    </body>
    </html>
  `;

  return (
    <div className="preview-page">
      <h1>{element1.title}</h1>
      <iframe
        srcDoc={iframeContent}
        style={{
          width: "100%",
          height: "500px",
          border: "1px solid #ccc",
        }}
      ></iframe>

      <button
        onClick={() =>
          navigator.clipboard.writeText(
            `<style>${element1.css}</style>\n${element1.html}\n<script>${
              element1.js || ""
            }</script>`
          )
        }
      >
        Copy Code
      </button>
    </div>
  );
}

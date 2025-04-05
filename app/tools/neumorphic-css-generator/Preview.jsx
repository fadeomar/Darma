import React, { useEffect, useRef } from "react";
import styled from "styled-components";

export const LightSource = styled.div`
  position: absolute;
  left: ${(props) => props.left};
  top: ${(props) => props.top};
  right: ${(props) => props.right};
  bottom: ${(props) => props.bottom};
  background: transparent;
  height: 30px;
  width: 30px;
  cursor: pointer;
  border: 2px solid var(--textColor);
  opacity: 0.8;
  border-bottom-right-radius: ${(props) =>
    props.right === "unset" && props.bottom === "unset" ? "30px" : "unset"};
  border-bottom-left-radius: ${(props) =>
    props.left === "unset" && props.bottom === "unset" ? "30px" : "unset"};
  border-top-right-radius: ${(props) =>
    props.right === "unset" && props.top === "unset" ? "30px" : "unset"};
  border-top-left-radius: ${(props) =>
    props.left === "unset" && props.top === "unset" ? "30px" : "unset"};

  &.active {
    background: radial-gradient(circle, #ffff00, #ffcc00, #ff9900);
  }
`;

const Preview = ({ previewBox, setActiveLightSource }) => {
  const lightSources = useRef([]);
  useEffect(() => {
    lightSources.current = [...document.querySelectorAll(".light-source")];
  }, []);
  const setLightSource = (e) => {
    lightSources.current.forEach((element) => {
      element.classList.remove("active");
    });
    e.target.classList.add("active");
    setActiveLightSource(parseInt(e.target.dataset.value));
  };
  return (
    <div className="preview">
      <LightSource
        top="0"
        bottom="unset"
        right="0"
        left="unset"
        data-value="2"
        onClick={setLightSource}
        className="light-source"
      ></LightSource>
      <LightSource
        top="0"
        bottom="unset"
        right="unset"
        left="0"
        data-value="1"
        onClick={setLightSource}
        className="light-source active"
      ></LightSource>
      <LightSource
        top="unset"
        bottom="0"
        right="0"
        left="unset"
        data-value="3"
        onClick={setLightSource}
        className="light-source"
      ></LightSource>
      <LightSource
        top="unset"
        bottom="0"
        right="unset"
        left="0"
        data-value="4"
        onClick={setLightSource}
        className="light-source"
      ></LightSource>
      <div
        ref={previewBox}
        className="soft-element soft-shadow max-w-[200] md:max-w-none max-h-[200] md:max-h-none"
      ></div>
    </div>
  );
};

export default Preview;

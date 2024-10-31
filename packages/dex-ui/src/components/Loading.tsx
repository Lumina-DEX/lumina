"use client";
import React, { useEffect, useMemo, useState } from "react";

// @ts-ignore
const Loading = () => {

  const nb = navigator.hardwareConcurrency;
  const countdown = 300 - 10 * nb;
  const time = countdown > 30 ? countdown : 30;


  const [counter, setCounter] = React.useState(time);

  useEffect(() => {
    counter > 0 && setTimeout(() => setCounter(counter - 1), 1000);
  }, [counter]);

  return (
    <>
      <div className="spinner-content" title="Estimated time to create a transaction">
        <div id="divSpinner" className="spinner loading">
          <div className="loading-text">{counter ? counter : ""}</div>
        </div>
      </div>
    </>
  );
};

export default Loading;

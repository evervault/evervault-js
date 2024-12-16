import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (import.meta.env.VITE_TEST_COVERAGE === "true") {
  // Post coverage metrics up to parent before unloading the iframe
  window.addEventListener("pagehide", () => {
    window.parent.postMessage(
      {
        type: "COVERAGE_REPORT",
        coverage: window.__coverage__,
      },
      "*"
    );
  });

  // Listen for requests for coverage metrics
  window.addEventListener("message", (event) => {
    if (event.data.type === "GET_COVERAGE_REPORT") {
      window.parent.postMessage(
        {
          type: "COVERAGE_REPORT",
          coverage: window.__coverage__,
          id: event.data.id,
        },
        "*"
      );
    }
  });
}

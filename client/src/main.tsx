import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { applyBrandTheme, getSavedBrandTheme } from "./services/theme";
import "./index.css";

applyBrandTheme(getSavedBrandTheme());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

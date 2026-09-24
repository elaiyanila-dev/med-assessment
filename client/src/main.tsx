import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { applyBrandTheme, getSavedBrandTheme } from "./services/theme";
import { queryClient } from "./services/queryClient";
import "./index.css";

applyBrandTheme(getSavedBrandTheme());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { rememberAttribution } from "./lib/attribution.ts";

rememberAttribution();

createRoot(document.getElementById("root")!).render(<App />);

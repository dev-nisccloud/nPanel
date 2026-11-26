import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { rememberAttribution } from "./lib/attribution.ts";
import { rememberInitialMarkup } from "./lib/initial-markup.ts";

rememberAttribution();

const root = document.getElementById("root")!;
rememberInitialMarkup(root.innerHTML);
createRoot(root).render(<App />);

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createTheme } from "theme-ui";

createRoot(document.getElementById("root")!).render(<App />);

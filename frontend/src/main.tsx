
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// SAFETY VALVE: Check for bloated tokens (Zombie Tokens)
// If we find a token larger than 10KB, it's likely corrupted with base64 image data.
// We must clear it to allow the app to function (otherwise Gateway blocks requests).
try {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
      const item = localStorage.getItem(key);
      if (item && item.length > 10000) { // 10KB limit
        console.warn("🚨 Bloated token detected! Purging to restore access...");
        localStorage.removeItem(key);
        // Optional: Clear everything to be safe
        localStorage.clear();
        window.location.reload();
      }
    }
  }
} catch (e) {
  console.error("Error checking token size:", e);
}

createRoot(document.getElementById("root")!).render(<App />);

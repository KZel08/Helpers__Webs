import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { LocationProvider } from "./contexts/LocationContext.tsx";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <LocationProvider>
      <App />
    </LocationProvider>
  </AuthProvider>
);
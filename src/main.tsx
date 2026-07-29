import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from "react-router-dom"
import { PreferencesProvider } from "./context/PreferencesContext";
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreferencesProvider>
      {window.location.protocol === "file:" ? (
        <HashRouter>
          <App />
        </HashRouter>
      ) : (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      )}
    </PreferencesProvider>
  </StrictMode>,
);

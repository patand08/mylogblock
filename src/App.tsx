import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { ThemeProvider } from "@/context/ThemeContext";
import WorkspacePage from "@/pages/WorkspacePage";
import ReadOnlyPage from "@/pages/ReadOnlyPage";
import SlugRedirectPage from "@/pages/SlugRedirectPage";
import LockScreen from "@/components/auth/LockScreen";
import { isAuthenticated } from "@/lib/auth";

function WorkspaceApp() {
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    isAuthenticated()
      .then((ok) => {
        if (mounted) setAuthed(ok);
      })
      .finally(() => {
        if (mounted) setCheckingAuth(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (checkingAuth) {
    return null;
  }

  if (!authed) {
    return <LockScreen onUnlock={() => setAuthed(true)} />;
  }

  return (
    <WorkspaceProvider>
      <Routes>
        <Route path="/" element={<WorkspacePage />} />
        <Route path="/page/:pageId" element={<WorkspacePage />} />
      </Routes>
    </WorkspaceProvider>
  );
}

function PageRoute() {
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    isAuthenticated()
      .then((ok) => {
        if (mounted) setAuthed(ok);
      })
      .finally(() => {
        if (mounted) setCheckingAuth(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (checkingAuth) return null;

  if (authed) {
    return (
      <WorkspaceProvider>
        <WorkspacePage />
      </WorkspaceProvider>
    );
  }

  return <ReadOnlyPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/s/:slug" element={<SlugRedirectPage />} />
          <Route path="/page/:pageId" element={<PageRoute />} />
          <Route path="/*" element={<WorkspaceApp />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Dashboard from "./pages/Dashboard/Dashboard";
import AuthPage from "./pages/Auth/AuthPage";

function MainContent() {
  const { showAuthModal, setShowAuthModal } = useAuth();

  return (
    <SocketProvider>
      <Dashboard />
      {showAuthModal && (
        <div
          className="auth-modal-overlay animate-fade-in"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="auth-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="auth-modal-close"
              onClick={() => setShowAuthModal(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <AuthPage inModal={true} />
          </div>
        </div>
      )}
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

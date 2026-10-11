import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const GUEST_USER = {
  name: "Guest Observer",
  role: "Viewer",
  email: "guest@fleetdash.local",
  isGuest: true,
};

export function AuthProvider({ children }) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      const savedToken = localStorage.getItem("fleetdash_token");
      const savedUser = localStorage.getItem("fleetdash_user");
      if (savedToken && savedToken !== "demo_jwt_token_123" && savedUser) {
        return { ...JSON.parse(savedUser), isGuest: false };
      }
      return GUEST_USER;
    } catch {
      return GUEST_USER;
    }
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem("fleetdash_token");
    return savedToken && savedToken !== "demo_jwt_token_123" ? savedToken : null;
  });

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const authUser = { ...data.user, isGuest: false };
        setUser(authUser);
        setToken(data.token);
        localStorage.setItem("fleetdash_user", JSON.stringify(authUser));
        localStorage.setItem("fleetdash_token", data.token);
        setShowAuthModal(false);
        return { success: true, message: "Login successful!" };
      } else {
        return { success: false, message: data.message || "Invalid credentials" };
      }
    } catch (err) {
      return { success: false, message: "Cannot reach the FleetDash server. Start the backend and check your API URL." };
    }
  };

  const register = async (name, email, password, role = "Manager") => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        return await login(email, password);
      } else {
        return { success: false, message: data.message || "Registration failed" };
      }
    } catch (err) {
      return { success: false, message: "Cannot reach the FleetDash server. Registration was not saved." };
    }
  };

  const quickDemoLogin = async () => {
    return await login("admin@fleetdash.local", "password123");
  };

  const logout = () => {
    setUser(GUEST_USER);
    setToken(null);
    localStorage.removeItem("fleetdash_user");
    localStorage.removeItem("fleetdash_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !user?.isGuest && !!token,
        isGuest: !!user?.isGuest,
        showAuthModal,
        setShowAuthModal,
        login,
        register,
        quickDemoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

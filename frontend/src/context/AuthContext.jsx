import { createContext, useContext, useMemo, useState } from "react";
import { apiRequest } from "../services/api.js";

const AuthContext = createContext(null);

const readStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem("smartbot_auth")) || { token: "", user: null };
  } catch {
    return { token: "", user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(readStoredAuth);

  const value = useMemo(
    () => ({
      ...auth,
      async login(email, password) {
        const data = await apiRequest("/auth/login", {
          method: "POST",
          body: { email, password }
        });
        const nextAuth = { token: data.token, user: data.user };
        localStorage.setItem("smartbot_auth", JSON.stringify(nextAuth));
        setAuth(nextAuth);
        return data.user;
      },
      logout() {
        localStorage.removeItem("smartbot_auth");
        setAuth({ token: "", user: null });
      }
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

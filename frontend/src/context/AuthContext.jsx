import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { setAuthToken, usersApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setAuthToken(null);
      setDbUser(null);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const token = await getToken();
        setAuthToken(token);
        const res = await usersApi.getMe();
        setDbUser(res.data);
      } catch {
        // User may not yet be synced from Clerk webhook
        setDbUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [isSignedIn, isLoaded, clerkUser]);

  // Refresh token before expiry
  useEffect(() => {
    if (!isSignedIn) return;
    const interval = setInterval(async () => {
      const token = await getToken();
      setAuthToken(token);
    }, 50 * 60 * 1000); // refresh every 50 min
    return () => clearInterval(interval);
  }, [isSignedIn]);

  return (
    <AuthContext.Provider value={{ dbUser, setDbUser, loading, isSignedIn, clerkUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAppAuth = () => useContext(AuthContext);

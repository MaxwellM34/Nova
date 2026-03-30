import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { api, usersApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const interceptorRef = useRef(null);

  // Attach interceptor: always fetch a fresh Clerk token before each request
  useEffect(() => {
    if (interceptorRef.current !== null) {
      api.interceptors.request.eject(interceptorRef.current);
    }
    interceptorRef.current = api.interceptors.request.use(async (config) => {
      if (isSignedIn) {
        const token = await getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }
      return config;
    });
    return () => {
      api.interceptors.request.eject(interceptorRef.current);
      interceptorRef.current = null;
    };
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setDbUser(null);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await usersApi.getMe();
        setDbUser(res.data);
      } catch {
        setDbUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [isSignedIn, isLoaded, clerkUser]);

  return (
    <AuthContext.Provider value={{ dbUser, setDbUser, loading, isSignedIn, clerkUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAppAuth = () => useContext(AuthContext);

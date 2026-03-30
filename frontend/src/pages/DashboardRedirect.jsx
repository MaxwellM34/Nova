import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function DashboardRedirect() {
  const { dbUser, loading } = useAppAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!dbUser) return;
    if (dbUser.role === "provider") navigate("/provider/dashboard", { replace: true });
    else if (dbUser.role === "admin") navigate("/admin", { replace: true });
    else navigate("/dashboard", { replace: true });
  }, [dbUser, loading, navigate]);

  return <LoadingSpinner className="min-h-screen" />;
}

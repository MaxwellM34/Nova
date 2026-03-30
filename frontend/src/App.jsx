import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Pages
import Landing from "./pages/Landing";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import DashboardRedirect from "./pages/DashboardRedirect";
import ProviderSearch from "./pages/ProviderSearch";
import ProviderProfile from "./pages/ProviderProfile";
import ProviderApply from "./pages/ProviderApply";
import ProviderDashboard from "./pages/ProviderDashboard";
import FamilyDashboard from "./pages/FamilyDashboard";
import ArrangementDetail from "./pages/ArrangementDetail";
import AdminPanel from "./pages/AdminPanel";

function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />
              <Route path="/providers" element={<ProviderSearch />} />
              <Route path="/providers/:id" element={<ProviderProfile />} />

              {/* Auth redirect */}
              <Route
                path="/dashboard-redirect"
                element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Family */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <FamilyDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Provider */}
              <Route
                path="/provider/apply"
                element={
                  <ProtectedRoute>
                    <ProviderApply />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/dashboard"
                element={
                  <ProtectedRoute>
                    <ProviderDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Shared */}
              <Route
                path="/arrangements/:id"
                element={
                  <ProtectedRoute>
                    <ArrangementDetail />
                  </ProtectedRoute>
                }
              />

              {/* Admin */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
    </AuthProvider>
  );
}

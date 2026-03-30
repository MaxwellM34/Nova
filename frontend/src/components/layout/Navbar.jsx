import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useAppAuth } from "../../context/AuthContext";
import clsx from "clsx";

export default function Navbar() {
  const { dbUser } = useAppAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isProvider = dbUser?.role === "provider";
  const isAdmin = dbUser?.role === "admin";

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-nova-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Nova</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/providers"
              className={clsx(
                "text-sm font-medium transition-colors",
                location.pathname.startsWith("/providers")
                  ? "text-nova-600"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Find Care
            </Link>
            <SignedIn>
              {isProvider && (
                <Link
                  to="/provider/dashboard"
                  className={clsx(
                    "text-sm font-medium transition-colors",
                    location.pathname.startsWith("/provider")
                      ? "text-nova-600"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  My Dashboard
                </Link>
              )}
              {!isProvider && !isAdmin && (
                <Link
                  to="/dashboard"
                  className={clsx(
                    "text-sm font-medium transition-colors",
                    location.pathname === "/dashboard"
                      ? "text-nova-600"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  My Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Admin
                </Link>
              )}
            </SignedIn>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <SignedOut>
              <Link to="/sign-in" className="btn-ghost text-sm">
                Sign in
              </Link>
              <Link to="/sign-up" className="btn-primary text-sm py-2 px-4">
                Get started
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-2">
            <Link to="/providers" className="block px-3 py-2 text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>
              Find Care
            </Link>
            <SignedIn>
              {isProvider ? (
                <Link to="/provider/dashboard" className="block px-3 py-2 text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>
                  My Dashboard
                </Link>
              ) : (
                <Link to="/dashboard" className="block px-3 py-2 text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>
                  My Dashboard
                </Link>
              )}
            </SignedIn>
            <SignedOut>
              <Link to="/sign-in" className="block px-3 py-2 text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
              <Link to="/sign-up" className="block px-3 py-2 text-sm font-medium text-nova-600" onClick={() => setMenuOpen(false)}>
                Get started
              </Link>
            </SignedOut>
          </div>
        )}
      </div>
    </nav>
  );
}

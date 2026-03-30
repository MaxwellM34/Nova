import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-nova-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">N</span>
        </div>
        <span className="font-bold text-2xl text-gray-900">Nova</span>
      </Link>
      <SignIn
        routing="path"
        path="/sign-in"
        afterSignInUrl="/dashboard-redirect"
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            card: "shadow-sm border border-gray-100 rounded-2xl",
            headerTitle: "text-gray-900 font-bold",
            primaryButton: "bg-nova-600 hover:bg-nova-700",
          },
        }}
      />
    </div>
  );
}

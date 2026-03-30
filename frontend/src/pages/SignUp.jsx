import React from "react";
import { SignUp } from "@clerk/clerk-react";
import { Link, useSearchParams } from "react-router-dom";

export default function SignUpPage() {
  const [params] = useSearchParams();
  const role = params.get("role") || "family";

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 bg-nova-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">N</span>
        </div>
        <span className="font-bold text-2xl text-gray-900">Nova</span>
      </Link>

      <p className="text-sm text-gray-500 mb-6">
        Signing up as a{" "}
        <strong className="text-gray-700">{role === "provider" ? "care provider" : "family"}</strong>.{" "}
        <Link
          to={`/sign-up?role=${role === "provider" ? "family" : "provider"}`}
          className="text-nova-600 underline"
        >
          Switch
        </Link>
      </p>

      <SignUp
        routing="path"
        path="/sign-up"
        afterSignUpUrl={role === "provider" ? "/provider/apply" : "/dashboard"}
        signInUrl="/sign-in"
        unsafeMetadata={{ role }}
        appearance={{
          elements: {
            card: "shadow-sm border border-gray-100 rounded-2xl",
            primaryButton: "bg-nova-600 hover:bg-nova-700",
          },
        }}
      />
    </div>
  );
}

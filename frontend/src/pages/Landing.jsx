import React from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

const PROVIDER_TYPES = [
  {
    icon: "🌙",
    title: "Night Nannies",
    desc: "Overnight newborn care specialists providing 8-12 hour shifts so families can rest.",
    rate: "From $35/hr",
    color: "bg-purple-50 border-purple-100",
  },
  {
    icon: "👶",
    title: "Newborn Care Specialists",
    desc: "Certified NCS professionals trained in sleep coaching and newborn development.",
    rate: "From $38/hr",
    color: "bg-blue-50 border-blue-100",
  },
  {
    icon: "💛",
    title: "Postpartum Doulas",
    desc: "Holistic overnight support for both baby and new parents during the fourth trimester.",
    rate: "From $45/hr",
    color: "bg-rose-50 border-rose-100",
  },
  {
    icon: "🏥",
    title: "Registered Nurses",
    desc: "Medically trained RNs for families with complex newborn care needs.",
    rate: "From $65/hr",
    color: "bg-emerald-50 border-emerald-100",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Browse vetted providers", desc: "Every provider is background-checked and approved by our team before going live." },
  { step: "02", title: "See live availability", desc: "Real-time calendars show exactly when providers are available. No guessing." },
  { step: "03", title: "Book directly", desc: "Message, schedule an intro call, and book. All terms are documented on the platform." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-nova-950 to-nova-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Serving DC, Maryland & Virginia
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Overnight newborn care
              <br />
              <span className="text-nova-300">you can actually count on</span>
            </h1>
            <p className="text-lg md:text-xl text-white/75 mb-8 leading-relaxed">
              Browse vetted night nannies, newborn care specialists, postpartum doulas, and registered nurses
              in the DC/MD/VA area. See real availability, verify credentials, and book directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <SignedOut>
                <Link
                  to="/sign-up?role=family"
                  className="btn-primary text-base px-8 py-4 bg-white text-nova-900 hover:bg-nova-50"
                >
                  Find overnight care
                </Link>
                <Link
                  to="/sign-up?role=provider"
                  className="btn-secondary text-base px-8 py-4 border-white/40 text-white hover:bg-white/10"
                >
                  Join as a provider
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/providers" className="btn-primary text-base px-8 py-4 bg-white text-nova-900 hover:bg-nova-50">
                  Browse providers
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-nova-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 gap-4 text-center text-white">
            <div>
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-white/70">Vetted providers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">DC/MD/VA</div>
              <div className="text-sm text-white/70">Coverage area</div>
            </div>
            <div>
              <div className="text-2xl font-bold">4–12hr</div>
              <div className="text-sm text-white/70">Flexible blocks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Provider types */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The right provider for every family
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Every provider on Nova is vetted before going live. We verify credentials, check references, and review experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROVIDER_TYPES.map((type) => (
              <div key={type.title} className={`card p-6 border ${type.color}`}>
                <div className="text-3xl mb-3">{type.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{type.title}</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{type.desc}</p>
                <span className="text-sm font-medium text-gray-700">{type.rate}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How Nova works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-nova-100 text-nova-700 font-bold flex items-center justify-center mx-auto mb-4 text-sm">
                  {step.step}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider CTA */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Are you an overnight care professional?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join Nova to get a professional profile, manage your schedule, and connect with families who specifically need overnight care — no more getting lost on general-purpose platforms.
          </p>
          <SignedOut>
            <Link to="/sign-up?role=provider" className="btn-primary bg-nova-500 hover:bg-nova-400 text-base px-8 py-4">
              Apply as a provider
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/provider/apply" className="btn-primary bg-nova-500 hover:bg-nova-400 text-base px-8 py-4">
              Submit your application
            </Link>
          </SignedIn>
        </div>
      </section>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { providersApi } from "../api/client";

const PROVIDER_TYPES = [
  { value: "babysitter_nanny", label: "Night Nanny / Babysitter", min_rate: 35 },
  { value: "newborn_care_specialist", label: "Newborn Care Specialist", min_rate: 38 },
  { value: "postpartum_doula", label: "Postpartum Doula", min_rate: 45 },
  { value: "registered_nurse", label: "Registered Nurse", min_rate: 65 },
];

const DAYS = [
  { label: "Monday", value: 0 },
  { label: "Tuesday", value: 1 },
  { label: "Wednesday", value: 2 },
  { label: "Thursday", value: 3 },
  { label: "Friday", value: 4 },
  { label: "Saturday", value: 5 },
  { label: "Sunday", value: 6 },
];

export default function ProviderApply() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [profile, setProfile] = useState({
    provider_type: "",
    bio: "",
    years_experience: "",
    hourly_rate: "",
    service_area_radius_miles: "25",
  });

  const [certifications, setCertifications] = useState([
    { name: "", issuing_org: "", year_obtained: "" },
  ]);

  const [availability, setAvailability] = useState([
    { day_of_week: "", start_time: "20:00", end_time: "08:00" },
  ]);

  const minRate = PROVIDER_TYPES.find(t => t.value === profile.provider_type)?.min_rate;

  const addCert = () => setCertifications([...certifications, { name: "", issuing_org: "", year_obtained: "" }]);
  const removeCert = (i) => setCertifications(certifications.filter((_, idx) => idx !== i));
  const setCert = (i, field, val) => setCertifications(certifications.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const addAvail = () => setAvailability([...availability, { day_of_week: "", start_time: "20:00", end_time: "08:00" }]);
  const removeAvail = (i) => setAvailability(availability.filter((_, idx) => idx !== i));
  const setAvailField = (i, field, val) => setAvailability(availability.map((a, idx) => idx === i ? { ...a, [field]: val } : a));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...profile,
        years_experience: profile.years_experience ? parseInt(profile.years_experience) : null,
        hourly_rate: parseFloat(profile.hourly_rate),
        service_area_radius_miles: parseInt(profile.service_area_radius_miles),
        certifications: certifications
          .filter(c => c.name)
          .map(c => ({ ...c, year_obtained: c.year_obtained ? parseInt(c.year_obtained) : null })),
        availability: availability
          .filter(a => a.day_of_week !== "")
          .map(a => ({ ...a, day_of_week: parseInt(a.day_of_week) })),
      };
      await providersApi.apply(payload);
      navigate("/provider/dashboard?applied=1");
    } catch (e) {
      setError(e.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = ["Profile", "Certifications", "Availability", "Review"];

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Provider Application</h1>
          <p className="text-gray-500 mt-2">Tell us about yourself. Our team reviews every application before approving access.</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <button
                className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                  step === i + 1
                    ? "bg-nova-600 text-white"
                    : step > i + 1
                    ? "bg-nova-100 text-nova-700"
                    : "text-gray-400"
                }`}
                onClick={() => step > i + 1 && setStep(i + 1)}
              >
                {s}
              </button>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>

        <div className="card p-6 md:p-8">
          {/* Step 1: Profile */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="label">Provider type *</label>
                <select
                  className="input"
                  required
                  value={profile.provider_type}
                  onChange={(e) => setProfile({ ...profile, provider_type: e.target.value })}
                >
                  <option value="">Select type...</option>
                  {PROVIDER_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Bio *</label>
                <textarea
                  className="input"
                  rows={5}
                  required
                  placeholder="Tell families about your background, approach, and what makes you a great overnight care provider..."
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Years of experience</label>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    placeholder="e.g. 5"
                    value={profile.years_experience}
                    onChange={(e) => setProfile({ ...profile, years_experience: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">
                    Hourly rate *{minRate && <span className="text-gray-400 font-normal"> (min ${minRate})</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      className="input pl-7"
                      required
                      min={minRate || 1}
                      placeholder={minRate ? `${minRate}+` : "0"}
                      value={profile.hourly_rate}
                      onChange={(e) => setProfile({ ...profile, hourly_rate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Service area radius (miles)</label>
                <input
                  type="range"
                  min={5}
                  max={75}
                  step={5}
                  value={profile.service_area_radius_miles}
                  onChange={(e) => setProfile({ ...profile, service_area_radius_miles: e.target.value })}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {profile.service_area_radius_miles} miles from your location
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Certifications */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Add your certifications and credentials. Our team will verify these before your profile goes live.</p>
              {certifications.map((cert, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 relative">
                  {certifications.length > 1 && (
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm"
                      onClick={() => removeCert(i)}
                    >
                      Remove
                    </button>
                  )}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="label text-xs">Certification name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. CPR Certified, RN License, Certified Postpartum Doula"
                        value={cert.name}
                        onChange={(e) => setCert(i, "name", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Issuing organization</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. American Red Cross"
                          value={cert.issuing_org}
                          onChange={(e) => setCert(i, "issuing_org", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Year obtained</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="2023"
                          min={1990}
                          max={new Date().getFullYear()}
                          value={cert.year_obtained}
                          onChange={(e) => setCert(i, "year_obtained", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn-ghost text-sm text-nova-600" onClick={addCert}>
                + Add another certification
              </button>
            </div>
          )}

          {/* Step 3: Availability */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Set your recurring weekly availability. Families will see this on your profile. You can update it anytime from your dashboard.</p>
              {availability.map((avail, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 relative">
                  {availability.length > 1 && (
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm"
                      onClick={() => removeAvail(i)}
                    >
                      Remove
                    </button>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label text-xs">Day</label>
                      <select
                        className="input"
                        value={avail.day_of_week}
                        onChange={(e) => setAvailField(i, "day_of_week", e.target.value)}
                      >
                        <option value="">Select day</option>
                        {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">Start time</label>
                      <input
                        type="time"
                        className="input"
                        value={avail.start_time}
                        onChange={(e) => setAvailField(i, "start_time", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">End time</label>
                      <input
                        type="time"
                        className="input"
                        value={avail.end_time}
                        onChange={(e) => setAvailField(i, "end_time", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn-ghost text-sm text-nova-600" onClick={addAvail}>
                + Add another time slot
              </button>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Review your application before submitting.</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <DetailRow label="Type" value={PROVIDER_TYPES.find(t => t.value === profile.provider_type)?.label} />
                <DetailRow label="Rate" value={`$${profile.hourly_rate}/hr`} />
                <DetailRow label="Experience" value={profile.years_experience ? `${profile.years_experience} years` : "Not specified"} />
                <DetailRow label="Service area" value={`${profile.service_area_radius_miles} miles`} />
                <DetailRow label="Certifications" value={`${certifications.filter(c => c.name).length} added`} />
                <DetailRow label="Availability slots" value={`${availability.filter(a => a.day_of_week !== "").length} days`} />
              </div>
              <div className="bg-nova-50 rounded-xl p-4 text-sm text-nova-800">
                <strong>What happens next:</strong> Our team will review your application and verify your credentials. You'll hear back within 1-2 business days.
              </div>
              {error && (
                <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button className="btn-ghost" onClick={() => setStep(step - 1)}>← Back</button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <button
                className="btn-primary"
                onClick={() => {
                  if (step === 1 && (!profile.provider_type || !profile.bio || !profile.hourly_rate)) {
                    alert("Please fill in all required fields.");
                    return;
                  }
                  setStep(step + 1);
                }}
              >
                Continue →
              </button>
            ) : (
              <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
                {submitting ? "Submitting..." : "Submit application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

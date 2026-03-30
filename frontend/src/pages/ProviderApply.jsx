import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { providersApi } from "../api/client";
import { useAppAuth } from "../context/AuthContext";

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

const ID_TYPES = [
  { value: "driver_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "state_id", label: "State ID" },
];

const STEPS = ["Personal Info", "Professional", "Safety & ID", "Certifications", "Availability", "Review"];

export default function ProviderApply() {
  const navigate = useNavigate();
  const { dbUser } = useAppAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [personal, setPersonal] = useState({
    phone_number: "",
    date_of_birth: "",
    languages_spoken: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });

  const [profile, setProfile] = useState({
    provider_type: "",
    bio: "",
    years_experience: "",
    hourly_rate: "",
    service_area_radius_miles: "25",
  });

  const [safety, setSafety] = useState({
    id_document_type: "",
    id_document_data: "",
    background_check_consent: false,
    has_own_transport: false,
    special_needs_experience: false,
    references_available: false,
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

  const handleIdUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setSafety(s => ({ ...s, id_document_data: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const validateStep = () => {
    if (step === 1) {
      if (!personal.phone_number || !personal.date_of_birth || !personal.emergency_contact_name || !personal.emergency_contact_phone) {
        alert("Please fill in all required personal fields (phone, date of birth, emergency contact name and phone).");
        return false;
      }
    }
    if (step === 2) {
      if (!profile.provider_type || !profile.bio || !profile.hourly_rate) {
        alert("Please fill in all required professional fields.");
        return false;
      }
    }
    if (step === 3) {
      if (!safety.id_document_type || !safety.id_document_data) {
        alert("Please select an ID type and upload a photo of your government-issued ID.");
        return false;
      }
      if (!safety.background_check_consent) {
        alert("You must consent to a background check to apply as a provider.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...profile,
        ...personal,
        ...safety,
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

  const firstName = dbUser?.first_name || "";
  const lastName = dbUser?.last_name || "";

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Provider Application</h1>
          <p className="text-gray-500 mt-2">Every application is reviewed by our team before approval. All information is kept private and secure.</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <button
                className={`text-xs font-medium px-2.5 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                  step === i + 1
                    ? "bg-nova-600 text-white"
                    : step > i + 1
                    ? "bg-nova-100 text-nova-700 cursor-pointer"
                    : "text-gray-400"
                }`}
                onClick={() => step > i + 1 && setStep(i + 1)}
              >
                {i + 1}. {s}
              </button>
              {i < STEPS.length - 1 && <div className="flex-shrink-0 w-4 h-px bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>

        <div className="card p-6 md:p-8">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-4">Applying as: <span className="text-gray-900">{[firstName, lastName].filter(Boolean).join(" ") || dbUser?.email}</span></p>
              </div>

              <div>
                <label className="label">Phone number *</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="(555) 555-5555"
                  value={personal.phone_number}
                  onChange={(e) => setPersonal({ ...personal, phone_number: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Date of birth *</label>
                <input
                  type="date"
                  className="input"
                  value={personal.date_of_birth}
                  onChange={(e) => setPersonal({ ...personal, date_of_birth: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">Must be 18 or older. Used for identity verification only.</p>
              </div>

              <div>
                <label className="label">Languages spoken</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. English, Spanish"
                  value={personal.languages_spoken}
                  onChange={(e) => setPersonal({ ...personal, languages_spoken: e.target.value })}
                />
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-gray-900 mb-3">Emergency contact *</h3>
                <div className="space-y-3">
                  <div>
                    <label className="label text-xs">Full name *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Emergency contact name"
                      value={personal.emergency_contact_name}
                      onChange={(e) => setPersonal({ ...personal, emergency_contact_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Phone number *</label>
                      <input
                        type="tel"
                        className="input"
                        placeholder="(555) 555-5555"
                        value={personal.emergency_contact_phone}
                        onChange={(e) => setPersonal({ ...personal, emergency_contact_phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Relationship</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Spouse, Parent"
                        value={personal.emergency_contact_relationship}
                        onChange={(e) => setPersonal({ ...personal, emergency_contact_relationship: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Professional Profile */}
          {step === 2 && (
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
                <div className="text-sm text-gray-500 mt-1">{profile.service_area_radius_miles} miles from your location</div>
              </div>
            </div>
          )}

          {/* Step 3: Safety & ID */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Government-issued ID *</h3>
                <p className="text-sm text-gray-500 mb-3">Required for all providers. Your ID is reviewed only by Nova staff and kept securely encrypted.</p>
                <div className="space-y-3">
                  <div>
                    <label className="label text-xs">ID type *</label>
                    <select
                      className="input"
                      value={safety.id_document_type}
                      onChange={(e) => setSafety({ ...safety, id_document_type: e.target.value })}
                    >
                      <option value="">Select ID type...</option>
                      {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Upload ID photo *</label>
                    {safety.id_document_data ? (
                      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-green-700 font-medium">ID uploaded</span>
                        <button
                          className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                          onClick={() => setSafety({ ...safety, id_document_data: "" })}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-nova-400 hover:bg-nova-50 transition-colors">
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm text-gray-500">Click to upload (JPG, PNG, PDF — max 5MB)</span>
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleIdUpload} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-gray-900 mb-3">Additional information</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 accent-nova-600"
                      checked={safety.has_own_transport}
                      onChange={(e) => setSafety({ ...safety, has_own_transport: e.target.checked })}
                    />
                    <span className="text-sm text-gray-700">I have reliable personal transportation</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 accent-nova-600"
                      checked={safety.special_needs_experience}
                      onChange={(e) => setSafety({ ...safety, special_needs_experience: e.target.checked })}
                    />
                    <span className="text-sm text-gray-700">I have experience working with infants with special needs</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 accent-nova-600"
                      checked={safety.references_available}
                      onChange={(e) => setSafety({ ...safety, references_available: e.target.checked })}
                    />
                    <span className="text-sm text-gray-700">I can provide professional references upon request</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-gray-100 hover:border-nova-300 transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 accent-nova-600"
                    checked={safety.background_check_consent}
                    onChange={(e) => setSafety({ ...safety, background_check_consent: e.target.checked })}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Background check consent *</span>
                    <p className="text-xs text-gray-500 mt-1">
                      I consent to Nova conducting a background check as part of my provider application. I understand this is required for all providers and will be conducted before my profile is approved.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Certifications */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Add your certifications and credentials. Our team will verify these before your profile goes live.</p>
              {certifications.map((cert, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 relative">
                  {certifications.length > 1 && (
                    <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm" onClick={() => removeCert(i)}>
                      Remove
                    </button>
                  )}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="label text-xs">Certification name</label>
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
                + Add certification
              </button>
            </div>
          )}

          {/* Step 5: Availability */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Set your recurring weekly availability. Families will see this on your profile.</p>
              {availability.map((avail, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 relative">
                  {availability.length > 1 && (
                    <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm" onClick={() => removeAvail(i)}>
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
                      <input type="time" className="input" value={avail.start_time} onChange={(e) => setAvailField(i, "start_time", e.target.value)} />
                    </div>
                    <div>
                      <label className="label text-xs">End time</label>
                      <input type="time" className="input" value={avail.end_time} onChange={(e) => setAvailField(i, "end_time", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn-ghost text-sm text-nova-600" onClick={addAvail}>
                + Add time slot
              </button>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Review your application before submitting.</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <DetailRow label="Name" value={[firstName, lastName].filter(Boolean).join(" ") || "—"} />
                <DetailRow label="Phone" value={personal.phone_number || "—"} />
                <DetailRow label="Date of birth" value={personal.date_of_birth || "—"} />
                <DetailRow label="Emergency contact" value={personal.emergency_contact_name || "—"} />
                <DetailRow label="Provider type" value={PROVIDER_TYPES.find(t => t.value === profile.provider_type)?.label || "—"} />
                <DetailRow label="Rate" value={profile.hourly_rate ? `$${profile.hourly_rate}/hr` : "—"} />
                <DetailRow label="Experience" value={profile.years_experience ? `${profile.years_experience} years` : "Not specified"} />
                <DetailRow label="Service area" value={`${profile.service_area_radius_miles} miles`} />
                <DetailRow label="Government ID" value={safety.id_document_data ? `${ID_TYPES.find(t => t.value === safety.id_document_type)?.label} ✓` : "Not uploaded"} />
                <DetailRow label="Background check" value={safety.background_check_consent ? "Consented ✓" : "Not consented"} />
                <DetailRow label="Certifications" value={`${certifications.filter(c => c.name).length} added`} />
                <DetailRow label="Availability slots" value={`${availability.filter(a => a.day_of_week !== "").length} days`} />
              </div>
              <div className="bg-nova-50 rounded-xl p-4 text-sm text-nova-800">
                <strong>What happens next:</strong> Our team will review your application, verify your ID and credentials, and be in touch within 1–2 business days.
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
            {step < STEPS.length ? (
              <button
                className="btn-primary"
                onClick={() => {
                  if (validateStep()) setStep(step + 1);
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

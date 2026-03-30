import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { providersApi, certsApi, availApi, paymentsApi } from "../api/client";
import { useAppAuth } from "../context/AuthContext";
import StatusBadge from "../components/ui/StatusBadge";
import StarRating from "../components/ui/StarRating";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ID_TYPES = [
  { value: "driver_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "state_id", label: "State ID" },
];

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "profile", label: "Professional" },
  { key: "personal", label: "Personal Info" },
  { key: "identity", label: "ID & Safety" },
  { key: "certifications", label: "Certifications" },
  { key: "availability", label: "Availability" },
  { key: "arrangements", label: "Arrangements" },
];

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{children}</p>;
}

function InfoRow({ label, value }) {
  if (!value && value !== false) return null;
  return (
    <div>
      <span className="text-xs text-gray-400 block">{label}</span>
      <span className="text-sm font-medium text-gray-900">{String(value)}</span>
    </div>
  );
}

export default function ProviderDashboard() {
  const [searchParams] = useSearchParams();
  const { dbUser, loading: authLoading } = useAppAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [saving, setSaving] = useState(false);

  // Edit states per tab
  const [editProfile, setEditProfile] = useState(false);
  const [editPersonal, setEditPersonal] = useState(false);
  const [editIdentity, setEditIdentity] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({});
  const [personalForm, setPersonalForm] = useState({});
  const [identityForm, setIdentityForm] = useState({});

  // Cert / availability forms
  const [certForm, setCertForm] = useState({ name: "", issuing_org: "", year_obtained: "" });
  const [availForm, setAvailForm] = useState({ day_of_week: "", start_time: "20:00", end_time: "08:00" });

  const appliedSuccess = searchParams.get("applied") === "1";

  const loadDashboard = async () => {
    try {
      const res = await providersApi.getDashboard();
      const p = res.data.profile;
      setDashboard(res.data);
      setProfileForm({
        bio: p.bio || "",
        hourly_rate: p.hourly_rate,
        years_experience: p.years_experience || "",
        service_area_radius_miles: p.service_area_radius_miles,
      });
      setPersonalForm({
        phone_number: p.phone_number || "",
        date_of_birth: p.date_of_birth || "",
        languages_spoken: p.languages_spoken || "",
        emergency_contact_name: p.emergency_contact_name || "",
        emergency_contact_phone: p.emergency_contact_phone || "",
        emergency_contact_relationship: p.emergency_contact_relationship || "",
        has_own_transport: p.has_own_transport ?? false,
        special_needs_experience: p.special_needs_experience ?? false,
        references_available: p.references_available ?? false,
      });
      setIdentityForm({
        id_document_type: p.id_document_type || "",
        id_document_data: p.id_document_data || "",
      });
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!authLoading) loadDashboard();
  }, [authLoading]);

  const save = async (payload) => {
    setSaving(true);
    try {
      await providersApi.updateMe(payload);
      await loadDashboard();
      return true;
    } catch { alert("Failed to save."); return false; }
    finally { setSaving(false); }
  };

  const saveProfile = async () => {
    const ok = await save({
      bio: profileForm.bio,
      hourly_rate: parseFloat(profileForm.hourly_rate),
      years_experience: profileForm.years_experience ? parseInt(profileForm.years_experience) : null,
      service_area_radius_miles: parseInt(profileForm.service_area_radius_miles),
    });
    if (ok) setEditProfile(false);
  };

  const savePersonal = async () => {
    const ok = await save({
      phone_number: personalForm.phone_number || null,
      date_of_birth: personalForm.date_of_birth || null,
      languages_spoken: personalForm.languages_spoken || null,
      emergency_contact_name: personalForm.emergency_contact_name || null,
      emergency_contact_phone: personalForm.emergency_contact_phone || null,
      emergency_contact_relationship: personalForm.emergency_contact_relationship || null,
      has_own_transport: personalForm.has_own_transport,
      special_needs_experience: personalForm.special_needs_experience,
      references_available: personalForm.references_available,
    });
    if (ok) setEditPersonal(false);
  };

  const saveIdentity = async () => {
    if (!identityForm.id_document_type || !identityForm.id_document_data) {
      alert("Please select an ID type and upload a photo.");
      return;
    }
    const ok = await save({
      id_document_type: identityForm.id_document_type,
      id_document_data: identityForm.id_document_data,
    });
    if (ok) setEditIdentity(false);
  };

  const handleIdUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File must be under 5MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setIdentityForm(f => ({ ...f, id_document_data: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const addCert = async () => {
    if (!certForm.name) return;
    try {
      await certsApi.add({ ...certForm, year_obtained: certForm.year_obtained ? parseInt(certForm.year_obtained) : null });
      setCertForm({ name: "", issuing_org: "", year_obtained: "" });
      await loadDashboard();
    } catch { alert("Failed to add certification."); }
  };

  const removeCert = async (id) => {
    if (!confirm("Remove this certification?")) return;
    try { await certsApi.remove(id); await loadDashboard(); }
    catch { alert("Failed to remove."); }
  };

  const addAvail = async () => {
    if (availForm.day_of_week === "") return;
    try {
      await availApi.add({ ...availForm, day_of_week: parseInt(availForm.day_of_week) });
      setAvailForm({ day_of_week: "", start_time: "20:00", end_time: "08:00" });
      await loadDashboard();
    } catch { alert("Failed to add availability."); }
  };

  const removeAvail = async (id) => {
    if (!confirm("Remove this availability slot?")) return;
    try { await availApi.remove(id); await loadDashboard(); }
    catch { alert("Failed to remove."); }
  };

  const connectStripe = async () => {
    try {
      const res = await paymentsApi.connectStripe();
      window.location.href = res.data.url;
    } catch { alert("Failed to connect Stripe."); }
  };

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  const profile = dashboard?.profile;
  const arrangements = dashboard?.arrangements || [];
  const reviews = dashboard?.reviews || [];
  const name = [dbUser?.first_name, dbUser?.last_name].filter(Boolean).join(" ") || "Provider";

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {appliedSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-green-500 text-lg">✓</span>
            <div>
              <p className="font-semibold text-green-800">Application submitted!</p>
              <p className="text-sm text-green-700">Our team will review your application within 1–2 business days.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Provider Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {name}</p>
          </div>
          {profile && <StatusBadge status={profile.status} />}
        </div>

        {!profile && (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Complete your application</h2>
            <p className="text-gray-500 mb-5">Submit your provider profile to get started on Nova.</p>
            <Link to="/provider/apply" className="btn-primary">Start application</Link>
          </div>
        )}

        {profile && (
          <>
            {/* Tab nav */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Overview ── */}
            {activeTab === "overview" && (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="card p-5">
                  <p className="text-sm text-gray-500 mb-1">Avg. rating</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{dashboard.avg_rating?.toFixed(1) || "—"}</span>
                    {dashboard.avg_rating && <StarRating rating={dashboard.avg_rating} size="md" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{dashboard.review_count} reviews</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-gray-500 mb-1">Arrangements</p>
                  <span className="text-2xl font-bold text-gray-900">{arrangements.length}</span>
                  <p className="text-xs text-gray-400 mt-1">{arrangements.filter(a => a.status === "confirmed").length} active</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-gray-500 mb-1">Profile status</p>
                  <StatusBadge status={profile.status} />
                  {profile.status === "rejected" && profile.rejection_reason && (
                    <p className="text-xs text-red-500 mt-2">{profile.rejection_reason}</p>
                  )}
                </div>

                {/* Profile completeness */}
                <div className="card p-5 md:col-span-3">
                  <h3 className="font-semibold text-gray-900 mb-3">Profile completeness</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Phone", done: !!profile.phone_number },
                      { label: "Date of birth", done: !!profile.date_of_birth },
                      { label: "Emergency contact", done: !!profile.emergency_contact_name },
                      { label: "Government ID", done: !!profile.id_document_data },
                      { label: "ID verified", done: profile.id_verified },
                      { label: "Background check", done: profile.background_check_consent },
                      { label: "Certifications", done: profile.certifications?.length > 0 },
                      { label: "Availability", done: profile.availability?.length > 0 },
                    ].map(item => (
                      <div key={item.label} className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${item.done ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
                        <span>{item.done ? "✓" : "○"}</span>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stripe */}
                <div className="card p-5 md:col-span-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Payment setup</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {profile.stripe_connect_account_id
                          ? "Stripe Connect connected. You can receive payments."
                          : "Connect Stripe to receive payments through the platform."}
                      </p>
                    </div>
                    {!profile.stripe_connect_account_id
                      ? <button className="btn-primary text-sm" onClick={connectStripe}>Connect Stripe</button>
                      : <span className="badge bg-green-50 text-green-700">Connected</span>
                    }
                  </div>
                </div>
              </div>
            )}

            {/* ── Professional Profile ── */}
            {activeTab === "profile" && (
              <div className="card p-6">
                {!editProfile ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900">Professional details</h3>
                      <button className="btn-ghost text-sm" onClick={() => setEditProfile(true)}>Edit</button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <InfoRow label="Provider type" value={profile.provider_type?.replace(/_/g, " ")} />
                      <InfoRow label="Hourly rate" value={`$${profile.hourly_rate}/hr`} />
                      <InfoRow label="Experience" value={profile.years_experience ? `${profile.years_experience} years` : "—"} />
                      <InfoRow label="Service area" value={`${profile.service_area_radius_miles} miles`} />
                    </div>
                    {profile.bio && (
                      <div className="pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400 block mb-1">Bio</span>
                        <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Bio</label>
                      <textarea className="input" rows={5} value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Hourly rate ($)</label>
                        <input type="number" className="input" value={profileForm.hourly_rate} onChange={(e) => setProfileForm({ ...profileForm, hourly_rate: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Years of experience</label>
                        <input type="number" className="input" value={profileForm.years_experience} onChange={(e) => setProfileForm({ ...profileForm, years_experience: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Service area (miles): {profileForm.service_area_radius_miles}</label>
                      <input type="range" min={5} max={75} step={5} value={profileForm.service_area_radius_miles} onChange={(e) => setProfileForm({ ...profileForm, service_area_radius_miles: e.target.value })} className="w-full" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button className="btn-ghost" onClick={() => setEditProfile(false)}>Cancel</button>
                      <button className="btn-primary" disabled={saving} onClick={saveProfile}>{saving ? "Saving..." : "Save"}</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Personal Info ── */}
            {activeTab === "personal" && (
              <div className="card p-6">
                {!editPersonal ? (
                  <div className="space-y-5">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900">Personal information</h3>
                      <button className="btn-ghost text-sm" onClick={() => setEditPersonal(true)}>Edit</button>
                    </div>

                    <div>
                      <SectionLabel>Contact</SectionLabel>
                      <div className="grid md:grid-cols-2 gap-4">
                        <InfoRow label="Phone number" value={profile.phone_number} />
                        <InfoRow label="Date of birth" value={profile.date_of_birth} />
                        <InfoRow label="Languages spoken" value={profile.languages_spoken} />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <SectionLabel>Emergency contact</SectionLabel>
                      {profile.emergency_contact_name ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          <InfoRow label="Name" value={profile.emergency_contact_name} />
                          <InfoRow label="Phone" value={profile.emergency_contact_phone} />
                          <InfoRow label="Relationship" value={profile.emergency_contact_relationship} />
                        </div>
                      ) : (
                        <p className="text-sm text-amber-600">No emergency contact on file. Please add one.</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <SectionLabel>Additional</SectionLabel>
                      <div className="grid md:grid-cols-3 gap-3">
                        {[
                          { label: "Own transportation", val: profile.has_own_transport },
                          { label: "Special needs experience", val: profile.special_needs_experience },
                          { label: "References available", val: profile.references_available },
                        ].map(({ label, val }) => (
                          <div key={label} className={`p-3 rounded-xl text-xs font-medium ${val === true ? "bg-green-50 text-green-700" : val === false ? "bg-gray-50 text-gray-400" : "bg-gray-50 text-gray-400"}`}>
                            {val === true ? "✓" : val === false ? "✕" : "—"} {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <h3 className="font-semibold text-gray-900">Edit personal information</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Phone number</label>
                        <input type="tel" className="input" placeholder="(555) 555-5555" value={personalForm.phone_number} onChange={(e) => setPersonalForm({ ...personalForm, phone_number: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Date of birth</label>
                        <input type="date" className="input" value={personalForm.date_of_birth} onChange={(e) => setPersonalForm({ ...personalForm, date_of_birth: e.target.value })} />
                      </div>
                    </div>

                    <div>
                      <label className="label">Languages spoken</label>
                      <input type="text" className="input" placeholder="e.g. English, Spanish" value={personalForm.languages_spoken} onChange={(e) => setPersonalForm({ ...personalForm, languages_spoken: e.target.value })} />
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <label className="label mb-3 block">Emergency contact</label>
                      <div className="space-y-3">
                        <input type="text" className="input" placeholder="Full name" value={personalForm.emergency_contact_name} onChange={(e) => setPersonalForm({ ...personalForm, emergency_contact_name: e.target.value })} />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="tel" className="input" placeholder="Phone number" value={personalForm.emergency_contact_phone} onChange={(e) => setPersonalForm({ ...personalForm, emergency_contact_phone: e.target.value })} />
                          <input type="text" className="input" placeholder="Relationship (e.g. Spouse)" value={personalForm.emergency_contact_relationship} onChange={(e) => setPersonalForm({ ...personalForm, emergency_contact_relationship: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <label className="label">Additional</label>
                      {[
                        { key: "has_own_transport", label: "I have reliable personal transportation" },
                        { key: "special_needs_experience", label: "I have experience with infants with special needs" },
                        { key: "references_available", label: "I can provide professional references on request" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 accent-nova-600" checked={personalForm[key]} onChange={(e) => setPersonalForm({ ...personalForm, [key]: e.target.checked })} />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button className="btn-ghost" onClick={() => setEditPersonal(false)}>Cancel</button>
                      <button className="btn-primary" disabled={saving} onClick={savePersonal}>{saving ? "Saving..." : "Save"}</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ID & Safety ── */}
            {activeTab === "identity" && (
              <div className="space-y-4">
                <div className="card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Government ID</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Reviewed only by Nova staff. Kept securely encrypted.</p>
                    </div>
                    {!editIdentity && (
                    <button className="btn-ghost text-sm" onClick={() => setEditIdentity(true)}>
                      {profile.id_document_data ? "Replace ID" : "Upload ID"}
                    </button>
                  )}
                  </div>

                  {!editIdentity ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div>
                          <span className="text-xs text-gray-400">Type</span>
                          <p className="text-sm font-medium text-gray-900">
                            {ID_TYPES.find(t => t.value === profile.id_document_type)?.label || "Not set"}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Verification status</span>
                          <div className="mt-0.5">
                            {profile.id_verified
                              ? <span className="badge bg-green-50 text-green-700">Verified ✓</span>
                              : <span className="badge bg-amber-50 text-amber-700">Pending review</span>
                            }
                          </div>
                        </div>
                      </div>
                      {profile.id_document_data ? (
                        profile.id_document_data.startsWith("data:image") ? (
                          <img src={profile.id_document_data} alt="Your ID" className="max-w-xs rounded-xl border border-gray-200 shadow-sm" />
                        ) : (
                          <p className="text-sm text-green-600 font-medium">ID document on file ✓</p>
                        )
                      ) : (
                        <p className="text-sm text-amber-600 font-medium">No ID uploaded yet. Please update your ID.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="label text-xs">ID type</label>
                        <select className="input" value={identityForm.id_document_type} onChange={(e) => setIdentityForm({ ...identityForm, id_document_type: e.target.value })}>
                          <option value="">Select ID type...</option>
                          {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        {profile.status === "approved" && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 mb-2">
                          Replacing your ID while approved will put your profile back in pending review.
                        </div>
                      )}
                      <label className="label text-xs">ID photo</label>
                        {identityForm.id_document_data ? (
                          <div className="space-y-2">
                            {identityForm.id_document_data.startsWith("data:image") && (
                              <img src={identityForm.id_document_data} alt="ID preview" className="max-w-xs rounded-xl border border-gray-200" />
                            )}
                            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                              <span className="text-sm text-green-700 font-medium">✓ ID ready to save</span>
                              <button className="ml-auto text-xs text-gray-400 hover:text-gray-600" onClick={() => setIdentityForm(f => ({ ...f, id_document_data: "" }))}>Remove</button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-nova-400 hover:bg-nova-50 transition-colors">
                            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm text-gray-500">Upload ID (JPG, PNG, PDF — max 5MB)</span>
                            <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleIdUpload} />
                          </label>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button className="btn-ghost" onClick={() => setEditIdentity(false)}>Cancel</button>
                        <button className="btn-primary" disabled={saving} onClick={saveIdentity}>{saving ? "Saving..." : "Save ID"}</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Background check */}
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-1">Background check</h3>
                  {profile.background_check_consent ? (
                    <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                      <span>✓</span> You have consented to a background check
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600">Background check consent not on file. Please contact support.</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Certifications ── */}
            {activeTab === "certifications" && (
              <div className="space-y-4">
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Your certifications</h3>
                  {!profile.certifications?.length ? (
                    <p className="text-sm text-gray-400">No certifications added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {profile.certifications.map((cert) => (
                        <div key={cert.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{cert.name}</span>
                              {cert.verified_by_admin
                                ? <span className="badge bg-green-50 text-green-700 text-xs">Verified</span>
                                : <span className="badge bg-amber-50 text-amber-700 text-xs">Pending</span>
                              }
                            </div>
                            {cert.issuing_org && <p className="text-xs text-gray-500">{cert.issuing_org}{cert.year_obtained ? ` · ${cert.year_obtained}` : ""}</p>}
                          </div>
                          <button className="text-xs text-red-400 hover:text-red-600" onClick={() => removeCert(cert.id)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Add certification</h3>
                  <div className="space-y-3">
                    <input type="text" className="input" placeholder="Certification name (e.g. CPR Certified)" value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" className="input" placeholder="Issuing organization" value={certForm.issuing_org} onChange={(e) => setCertForm({ ...certForm, issuing_org: e.target.value })} />
                      <input type="number" className="input" placeholder="Year obtained" value={certForm.year_obtained} onChange={(e) => setCertForm({ ...certForm, year_obtained: e.target.value })} />
                    </div>
                    <button className="btn-primary text-sm" onClick={addCert}>Add certification</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Availability ── */}
            {activeTab === "availability" && (
              <div className="space-y-4">
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Current availability</h3>
                  {!profile.availability?.length ? (
                    <p className="text-sm text-gray-400">No availability slots set.</p>
                  ) : (
                    <div className="space-y-2">
                      {profile.availability.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                          <div>
                            <span className="font-medium">{a.day_of_week != null ? DAYS[a.day_of_week] : a.specific_date}</span>
                            <span className="text-gray-500 ml-2">{a.start_time} – {a.end_time}</span>
                          </div>
                          <button className="text-xs text-red-400 hover:text-red-600" onClick={() => removeAvail(a.id)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Add availability</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label text-xs">Day</label>
                      <select className="input" value={availForm.day_of_week} onChange={(e) => setAvailForm({ ...availForm, day_of_week: e.target.value })}>
                        <option value="">Select day</option>
                        {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">Start time</label>
                      <input type="time" className="input" value={availForm.start_time} onChange={(e) => setAvailForm({ ...availForm, start_time: e.target.value })} />
                    </div>
                    <div>
                      <label className="label text-xs">End time</label>
                      <input type="time" className="input" value={availForm.end_time} onChange={(e) => setAvailForm({ ...availForm, end_time: e.target.value })} />
                    </div>
                  </div>
                  <button className="btn-primary text-sm mt-4" onClick={addAvail}>Add slot</button>
                </div>
              </div>
            )}

            {/* ── Arrangements ── */}
            {activeTab === "arrangements" && (
              <div className="space-y-4">
                {arrangements.length === 0 ? (
                  <div className="card p-10 text-center">
                    <div className="text-4xl mb-3">📅</div>
                    <p className="text-gray-500">No arrangements yet. Once families book you, they'll appear here.</p>
                  </div>
                ) : (
                  arrangements.map((a) => (
                    <div key={a.id} className="card p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={a.status} />
                            <span className="text-xs text-gray-400">#{a.id}</span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-0.5">
                            <p>{a.start_date} · {a.start_time} – {a.end_time} · {a.duration_hours}hrs</p>
                            <p>${a.rate_agreed}/hr · <span className="capitalize">{a.service_type}</span></p>
                          </div>
                        </div>
                        <Link to={`/arrangements/${a.id}`} className="btn-ghost text-xs py-1.5 px-3">View</Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

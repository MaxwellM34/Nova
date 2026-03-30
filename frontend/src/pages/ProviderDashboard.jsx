import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { providersApi, certsApi, availApi, paymentsApi } from "../api/client";
import { useAppAuth } from "../context/AuthContext";
import StatusBadge from "../components/ui/StatusBadge";
import StarRating from "../components/ui/StarRating";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProviderDashboard() {
  const [searchParams] = useSearchParams();
  const { dbUser } = useAppAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [certForm, setCertForm] = useState({ name: "", issuing_org: "", year_obtained: "" });
  const [availForm, setAvailForm] = useState({ day_of_week: "", start_time: "20:00", end_time: "08:00" });
  const [saving, setSaving] = useState(false);

  const appliedSuccess = searchParams.get("applied") === "1";

  const loadDashboard = async () => {
    try {
      const res = await providersApi.getDashboard();
      setDashboard(res.data);
      setProfileForm({
        bio: res.data.profile.bio || "",
        hourly_rate: res.data.profile.hourly_rate,
        years_experience: res.data.profile.years_experience || "",
        service_area_radius_miles: res.data.profile.service_area_radius_miles,
      });
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadDashboard(); }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await providersApi.updateMe({
        bio: profileForm.bio,
        hourly_rate: parseFloat(profileForm.hourly_rate),
        years_experience: profileForm.years_experience ? parseInt(profileForm.years_experience) : null,
        service_area_radius_miles: parseInt(profileForm.service_area_radius_miles),
      });
      await loadDashboard();
      setEditProfile(false);
    } catch { alert("Failed to save."); }
    finally { setSaving(false); }
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
    try {
      await certsApi.remove(id);
      await loadDashboard();
    } catch { alert("Failed to remove."); }
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
    try {
      await availApi.remove(id);
      await loadDashboard();
    } catch { alert("Failed to remove."); }
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

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "profile", label: "Profile" },
    { key: "certifications", label: "Certifications" },
    { key: "availability", label: "Availability" },
    { key: "arrangements", label: "Arrangements" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {appliedSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-green-500 text-lg">✓</span>
            <div>
              <p className="font-semibold text-green-800">Application submitted!</p>
              <p className="text-sm text-green-700">Our team will review your application and be in touch within 1-2 business days.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Provider Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {name}</p>
          </div>
          {profile && (
            <StatusBadge status={profile.status} />
          )}
        </div>

        {/* Profile not yet created */}
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
            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeTab === tab.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview */}
            {activeTab === "overview" && (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="card p-5">
                  <p className="text-sm text-gray-500 mb-1">Avg. rating</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {dashboard.avg_rating?.toFixed(1) || "—"}
                    </span>
                    {dashboard.avg_rating && <StarRating rating={dashboard.avg_rating} size="md" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{dashboard.review_count} reviews</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-gray-500 mb-1">Arrangements</p>
                  <span className="text-2xl font-bold text-gray-900">{arrangements.length}</span>
                  <p className="text-xs text-gray-400 mt-1">
                    {arrangements.filter(a => a.status === "confirmed").length} active
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-gray-500 mb-1">Profile status</p>
                  <StatusBadge status={profile.status} />
                  {profile.status === "rejected" && profile.rejection_reason && (
                    <p className="text-xs text-red-500 mt-2">{profile.rejection_reason}</p>
                  )}
                </div>

                {/* Stripe Connect */}
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
                    {!profile.stripe_connect_account_id && (
                      <button className="btn-primary text-sm" onClick={connectStripe}>
                        Connect Stripe
                      </button>
                    )}
                    {profile.stripe_connect_account_id && (
                      <span className="badge bg-green-50 text-green-700">Connected</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile editor */}
            {activeTab === "profile" && (
              <div className="card p-6">
                {!editProfile ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900">Profile details</h3>
                      <button className="btn-ghost text-sm" onClick={() => setEditProfile(true)}>Edit</button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block">Provider type</span>
                        <span className="font-medium capitalize">{profile.provider_type?.replace(/_/g, " ")}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Hourly rate</span>
                        <span className="font-medium">${profile.hourly_rate}/hr</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Experience</span>
                        <span className="font-medium">{profile.years_experience ? `${profile.years_experience} years` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Service area</span>
                        <span className="font-medium">{profile.service_area_radius_miles} miles</span>
                      </div>
                    </div>
                    {profile.bio && (
                      <div className="pt-4 border-t border-gray-100">
                        <span className="text-gray-500 text-sm block mb-1">Bio</span>
                        <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Bio</label>
                      <textarea
                        className="input"
                        rows={5}
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Hourly rate ($)</label>
                        <input
                          type="number"
                          className="input"
                          value={profileForm.hourly_rate}
                          onChange={(e) => setProfileForm({ ...profileForm, hourly_rate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label">Years of experience</label>
                        <input
                          type="number"
                          className="input"
                          value={profileForm.years_experience}
                          onChange={(e) => setProfileForm({ ...profileForm, years_experience: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Service area (miles)</label>
                      <input
                        type="range"
                        min={5}
                        max={75}
                        step={5}
                        value={profileForm.service_area_radius_miles}
                        onChange={(e) => setProfileForm({ ...profileForm, service_area_radius_miles: e.target.value })}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{profileForm.service_area_radius_miles} miles</span>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button className="btn-ghost" onClick={() => setEditProfile(false)}>Cancel</button>
                      <button className="btn-primary" disabled={saving} onClick={saveProfile}>
                        {saving ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Certifications */}
            {activeTab === "certifications" && (
              <div className="space-y-4">
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Your certifications</h3>
                  {profile.certifications?.length === 0 ? (
                    <p className="text-sm text-gray-400">No certifications added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {profile.certifications?.map((cert) => (
                        <div key={cert.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{cert.name}</span>
                              {cert.verified_by_admin ? (
                                <span className="badge bg-green-50 text-green-700 text-xs">Verified</span>
                              ) : (
                                <span className="badge bg-amber-50 text-amber-700 text-xs">Pending verification</span>
                              )}
                            </div>
                            {cert.issuing_org && <p className="text-xs text-gray-500">{cert.issuing_org}</p>}
                          </div>
                          <button
                            className="text-xs text-red-400 hover:text-red-600"
                            onClick={() => removeCert(cert.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Add certification</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="md:col-span-3">
                      <label className="label text-xs">Certification name *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. CPR Certified"
                        value={certForm.name}
                        onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label text-xs">Issuing organization</label>
                      <input
                        type="text"
                        className="input"
                        value={certForm.issuing_org}
                        onChange={(e) => setCertForm({ ...certForm, issuing_org: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Year</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="2024"
                        value={certForm.year_obtained}
                        onChange={(e) => setCertForm({ ...certForm, year_obtained: e.target.value })}
                      />
                    </div>
                  </div>
                  <button className="btn-primary text-sm mt-4" onClick={addCert}>Add certification</button>
                </div>
              </div>
            )}

            {/* Availability */}
            {activeTab === "availability" && (
              <div className="space-y-4">
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Current availability</h3>
                  {profile.availability?.length === 0 ? (
                    <p className="text-sm text-gray-400">No availability slots set.</p>
                  ) : (
                    <div className="space-y-2">
                      {profile.availability?.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                          <div>
                            {a.day_of_week != null ? (
                              <span className="font-medium">{DAYS[a.day_of_week]}</span>
                            ) : (
                              <span className="font-medium">{a.specific_date}</span>
                            )}
                            <span className="text-gray-500 ml-2">{a.start_time} – {a.end_time}</span>
                          </div>
                          <button
                            className="text-xs text-red-400 hover:text-red-600"
                            onClick={() => removeAvail(a.id)}
                          >
                            Remove
                          </button>
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
                      <select
                        className="input"
                        value={availForm.day_of_week}
                        onChange={(e) => setAvailForm({ ...availForm, day_of_week: e.target.value })}
                      >
                        <option value="">Select day</option>
                        {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">Start time</label>
                      <input
                        type="time"
                        className="input"
                        value={availForm.start_time}
                        onChange={(e) => setAvailForm({ ...availForm, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">End time</label>
                      <input
                        type="time"
                        className="input"
                        value={availForm.end_time}
                        onChange={(e) => setAvailForm({ ...availForm, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <button className="btn-primary text-sm mt-4" onClick={addAvail}>Add slot</button>
                </div>
              </div>
            )}

            {/* Arrangements */}
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
                        <Link to={`/arrangements/${a.id}`} className="btn-ghost text-xs py-1.5 px-3">
                          View
                        </Link>
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

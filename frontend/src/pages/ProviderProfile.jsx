import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { providersApi, callsApi } from "../api/client";
import { useAppAuth } from "../context/AuthContext";
import StarRating from "../components/ui/StarRating";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatusBadge from "../components/ui/StatusBadge";
import clsx from "clsx";

const PROVIDER_TYPE_LABELS = {
  babysitter_nanny: "Night Nanny",
  newborn_care_specialist: "Newborn Care Specialist",
  postpartum_doula: "Postpartum Doula",
  registered_nurse: "Registered Nurse",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dbUser } = useAppAuth();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callForm, setCallForm] = useState({ call_type: "virtual", proposed_datetime: "", notes: "" });
  const [callSubmitting, setCallSubmitting] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);

  useEffect(() => {
    Promise.all([providersApi.getById(id), providersApi.getReviews(id)])
      .then(([pRes, rRes]) => {
        setProvider(pRes.data);
        setReviews(rRes.data);
      })
      .catch(() => navigate("/providers"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleScheduleCall = async (e) => {
    e.preventDefault();
    setCallSubmitting(true);
    try {
      await callsApi.schedule(id, callForm);
      setCallSuccess(true);
      setTimeout(() => { setCallModalOpen(false); setCallSuccess(false); }, 2000);
    } catch {
      alert("Failed to schedule call. Please try again.");
    } finally {
      setCallSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!provider) return null;

  const name = [provider.first_name, provider.last_name].filter(Boolean).join(" ") || "Provider";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const typeLabel = PROVIDER_TYPE_LABELS[provider.provider_type] || provider.provider_type;

  // Group recurring availability by day
  const recurringByDay = {};
  (provider.availability || []).filter(a => a.day_of_week != null).forEach(a => {
    if (!recurringByDay[a.day_of_week]) recurringByDay[a.day_of_week] = [];
    recurringByDay[a.day_of_week].push(a);
  });

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="btn-ghost mb-6 -ml-2 text-sm">
          ← Back to search
        </button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: profile card */}
          <div className="md:col-span-1">
            <div className="card p-6 sticky top-24">
              <div className="w-20 h-20 rounded-full bg-nova-100 flex items-center justify-center text-nova-700 font-bold text-2xl mx-auto mb-4">
                {initials}
              </div>
              <h1 className="text-xl font-bold text-gray-900 text-center">{name}</h1>
              <p className="text-center text-sm text-gray-500 mt-1">{typeLabel}</p>

              {(provider.city || provider.state) && (
                <p className="text-center text-sm text-gray-400 mt-1">
                  {[provider.city, provider.state].filter(Boolean).join(", ")}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rate</span>
                  <span className="font-semibold text-gray-900">${provider.hourly_rate}/hr</span>
                </div>
                {provider.years_experience && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Experience</span>
                    <span className="text-gray-700">{provider.years_experience} years</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service area</span>
                  <span className="text-gray-700">{provider.service_area_radius_miles} mi radius</span>
                </div>
                {reviews.length > 0 && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Rating</span>
                    <div className="flex items-center gap-1">
                      <StarRating rating={provider.avg_rating} />
                      <span className="text-xs text-gray-500">({reviews.length})</span>
                    </div>
                  </div>
                )}
              </div>

              {dbUser && dbUser.role === "family" && (
                <button
                  className="btn-primary w-full mt-5 text-sm"
                  onClick={() => setCallModalOpen(true)}
                >
                  Schedule intro call
                </button>
              )}

              {provider.is_boosted && (
                <div className="mt-3 text-center">
                  <span className="badge bg-amber-50 text-amber-700">Featured Provider</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: details */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            {provider.bio && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed">{provider.bio}</p>
              </div>
            )}

            {/* Certifications */}
            {provider.certifications?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Certifications & Credentials</h2>
                <div className="space-y-3">
                  {provider.certifications.map((cert) => (
                    <div key={cert.id} className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">{cert.name}</span>
                          {cert.verified_by_admin ? (
                            <span className="badge bg-green-50 text-green-700 text-xs">Verified</span>
                          ) : (
                            <span className="badge bg-gray-100 text-gray-500 text-xs">Unverified</span>
                          )}
                        </div>
                        {cert.issuing_org && (
                          <p className="text-xs text-gray-500 mt-0.5">{cert.issuing_org}</p>
                        )}
                      </div>
                      {cert.year_obtained && (
                        <span className="text-xs text-gray-400">{cert.year_obtained}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            {Object.keys(recurringByDay).length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Weekly Availability</h2>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((day, i) => (
                    <div
                      key={i}
                      className={clsx(
                        "rounded-lg p-2 text-center text-xs",
                        recurringByDay[i]
                          ? "bg-nova-100 text-nova-700 font-medium"
                          : "bg-gray-50 text-gray-300"
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1">
                  {Object.entries(recurringByDay).map(([day, slots]) => (
                    <div key={day} className="text-sm text-gray-600">
                      <span className="font-medium">{DAYS[parseInt(day)]}:</span>{" "}
                      {slots.map(s => `${s.start_time} – ${s.end_time}`).join(", ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                Reviews {reviews.length > 0 && <span className="text-gray-400 font-normal">({reviews.length})</span>}
              </h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={r.rating} size="sm" />
                        <span className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {r.text && <p className="text-sm text-gray-600">{r.text}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule call modal */}
      {callModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Schedule intro call with {name}</h3>

            {callSuccess ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-gray-900">Request sent!</p>
                <p className="text-sm text-gray-500 mt-1">The provider will confirm your call time.</p>
              </div>
            ) : (
              <form onSubmit={handleScheduleCall} className="space-y-4">
                <div>
                  <label className="label">Call type</label>
                  <select
                    className="input"
                    value={callForm.call_type}
                    onChange={(e) => setCallForm((f) => ({ ...f, call_type: e.target.value }))}
                  >
                    <option value="virtual">Virtual (video call)</option>
                    <option value="in_person">In person</option>
                  </select>
                </div>
                <div>
                  <label className="label">Proposed date & time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    required
                    value={callForm.proposed_datetime}
                    onChange={(e) => setCallForm((f) => ({ ...f, proposed_datetime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Notes (optional)</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Tell the provider about your needs..."
                    value={callForm.notes}
                    onChange={(e) => setCallForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" className="btn-ghost flex-1" onClick={() => setCallModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={callSubmitting}>
                    {callSubmitting ? "Sending..." : "Send request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

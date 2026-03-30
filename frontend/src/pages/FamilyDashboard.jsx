import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { arrangementsApi } from "../api/client";
import { useAppAuth } from "../context/AuthContext";
import StatusBadge from "../components/ui/StatusBadge";
import StarRating from "../components/ui/StarRating";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function FamilyDashboard() {
  const { dbUser } = useAppAuth();
  const [arrangements, setArrangements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "" });

  useEffect(() => {
    arrangementsApi.getMe()
      .then((res) => setArrangements(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = arrangements.filter((a) => ["pending", "confirmed"].includes(a.status));
  const past = arrangements.filter((a) => ["completed", "cancelled"].includes(a.status));
  const shown = activeTab === "active" ? active : past;

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await arrangementsApi.review(reviewModal.id, reviewForm);
      setReviewModal(null);
      // Reload
      const res = await arrangementsApi.getMe();
      setArrangements(res.data);
    } catch {
      alert("Failed to submit review.");
    }
  };

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome back{dbUser?.first_name ? `, ${dbUser.first_name}` : ""}
            </h1>
            <p className="text-gray-500 mt-1">Manage your care arrangements</p>
          </div>
          <Link to="/providers" className="btn-primary text-sm py-2 px-4">
            Find providers
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { key: "active", label: `Active (${active.length})` },
            { key: "past", label: `Past (${past.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

        {shown.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {activeTab === "active" ? "No active arrangements" : "No past arrangements"}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {activeTab === "active"
                ? "Browse providers and create your first arrangement."
                : "Completed arrangements will appear here."}
            </p>
            {activeTab === "active" && (
              <Link to="/providers" className="btn-primary text-sm">Browse providers</Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map((a) => (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={a.status} />
                      <span className="text-xs text-gray-400">Arrangement #{a.id}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500 block text-xs">Start date</span>
                        <span className="font-medium">{a.start_date}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs">Schedule</span>
                        <span className="font-medium">{a.start_time} – {a.end_time}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs">Duration</span>
                        <span className="font-medium">{a.duration_hours} hrs</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs">Rate agreed</span>
                        <span className="font-medium">${a.rate_agreed}/hr</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 capitalize">
                      {a.service_type} · {a.payment_method === "platform" ? "Paid via platform" : "Direct payment"}
                      {a.recurring && " · Recurring"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link to={`/arrangements/${a.id}`} className="btn-ghost text-xs py-1.5 px-3">
                      View details
                    </Link>
                    {a.status === "completed" && !a.has_review && (
                      <button
                        className="btn-primary text-xs py-1.5 px-3"
                        onClick={() => { setReviewModal(a); setReviewForm({ rating: 5, text: "" }); }}
                      >
                        Leave review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Leave a review</h3>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="label">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`text-2xl transition-transform hover:scale-110 ${
                        star <= reviewForm.rating ? "text-amber-400" : "text-gray-200"
                      }`}
                      onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Your experience (optional)</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Share your experience with other families..."
                  value={reviewForm.text}
                  onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-ghost flex-1" onClick={() => setReviewModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">Submit review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

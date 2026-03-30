import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { arrangementsApi } from "../api/client";
import { useAppAuth } from "../context/AuthContext";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function ArrangementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dbUser } = useAppAuth();
  const [arrangement, setArrangement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    arrangementsApi.getById(id)
      .then((res) => setArrangement(res.data))
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      const res = await arrangementsApi.update(id, { status });
      setArrangement(res.data);
    } catch {
      alert("Failed to update arrangement.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!arrangement) return null;

  const isFamily = dbUser?.role === "family";
  const isProvider = dbUser?.role === "provider";

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-6 -ml-2 text-sm">
          ← Back
        </button>

        <div className="card p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Arrangement #{arrangement.id}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Created {new Date(arrangement.created_at).toLocaleDateString()}
              </p>
            </div>
            <StatusBadge status={arrangement.status} />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Schedule</h3>
              <DetailRow label="Start date" value={arrangement.start_date} />
              {arrangement.end_date && <DetailRow label="End date" value={arrangement.end_date} />}
              <DetailRow label="Time" value={`${arrangement.start_time} – ${arrangement.end_time}`} />
              <DetailRow label="Duration" value={`${arrangement.duration_hours} hours`} />
              <DetailRow label="Service type" value={arrangement.service_type} />
              {arrangement.recurring && (
                <DetailRow
                  label="Recurring days"
                  value={arrangement.days_of_week?.map(d => ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][d]).join(", ")}
                />
              )}
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Payment</h3>
              <DetailRow label="Rate agreed" value={`$${arrangement.rate_agreed}/hr`} />
              <DetailRow label="Total est." value={`$${(arrangement.rate_agreed * arrangement.duration_hours).toFixed(0)}`} />
              <DetailRow label="Payment method" value={arrangement.payment_method === "platform" ? "Via platform" : "Direct"} />
            </div>
          </div>

          {arrangement.notes && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Notes</h3>
              <p className="text-sm text-gray-600">{arrangement.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            {isProvider && arrangement.status === "pending" && (
              <>
                <button
                  className="btn-primary text-sm"
                  disabled={updating}
                  onClick={() => updateStatus("confirmed")}
                >
                  Confirm arrangement
                </button>
                <button
                  className="btn-ghost text-sm text-red-500"
                  disabled={updating}
                  onClick={() => updateStatus("cancelled")}
                >
                  Decline
                </button>
              </>
            )}
            {isProvider && arrangement.status === "confirmed" && (
              <button
                className="btn-primary text-sm"
                disabled={updating}
                onClick={() => updateStatus("completed")}
              >
                Mark as completed
              </button>
            )}
            {isFamily && arrangement.status === "pending" && (
              <button
                className="btn-ghost text-sm text-red-500"
                disabled={updating}
                onClick={() => updateStatus("cancelled")}
              >
                Cancel request
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
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 capitalize">{value}</span>
    </div>
  );
}

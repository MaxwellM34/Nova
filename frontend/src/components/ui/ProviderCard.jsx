import React from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import clsx from "clsx";

const PROVIDER_TYPE_LABELS = {
  babysitter_nanny: "Night Nanny",
  newborn_care_specialist: "Newborn Care Specialist",
  postpartum_doula: "Postpartum Doula",
  registered_nurse: "Registered Nurse",
};

const PROVIDER_TYPE_COLORS = {
  babysitter_nanny: "bg-purple-100 text-purple-700",
  newborn_care_specialist: "bg-blue-100 text-blue-700",
  postpartum_doula: "bg-rose-100 text-rose-700",
  registered_nurse: "bg-emerald-100 text-emerald-700",
};

export default function ProviderCard({ provider }) {
  const label = PROVIDER_TYPE_LABELS[provider.provider_type] || provider.provider_type;
  const colorCls = PROVIDER_TYPE_COLORS[provider.provider_type] || "bg-gray-100 text-gray-700";
  const name = [provider.first_name, provider.last_name].filter(Boolean).join(" ") || "Provider";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const location = [provider.city, provider.state].filter(Boolean).join(", ");

  return (
    <Link to={`/providers/${provider.id}`} className="card p-5 hover:shadow-md transition-shadow block group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-nova-100 flex items-center justify-center text-nova-700 font-semibold text-lg">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-nova-600 transition-colors">
                {name}
              </h3>
              <span className={clsx("badge mt-1", colorCls)}>{label}</span>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-gray-900">${provider.hourly_rate}/hr</div>
              {provider.distance_miles != null && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {provider.distance_miles.toFixed(1)} mi
                </div>
              )}
            </div>
          </div>

          {provider.bio && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{provider.bio}</p>
          )}

          <div className="flex items-center gap-4 mt-3">
            {provider.avg_rating != null ? (
              <div className="flex items-center gap-1">
                <StarRating rating={provider.avg_rating} />
                <span className="text-xs text-gray-500">
                  {provider.avg_rating.toFixed(1)} ({provider.review_count})
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">No reviews yet</span>
            )}
            {location && (
              <span className="text-xs text-gray-400">{location}</span>
            )}
            {provider.years_experience && (
              <span className="text-xs text-gray-400">{provider.years_experience} yrs exp</span>
            )}
          </div>
        </div>
      </div>

      {provider.is_boosted && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className="badge bg-amber-50 text-amber-700">Featured Provider</span>
        </div>
      )}
    </Link>
  );
}

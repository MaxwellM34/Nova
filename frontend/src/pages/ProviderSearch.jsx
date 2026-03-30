import React, { useState, useEffect, useCallback } from "react";
import { providersApi } from "../api/client";
import ProviderCard from "../components/ui/ProviderCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const PROVIDER_TYPES = [
  { value: "", label: "All types" },
  { value: "babysitter_nanny", label: "Night Nanny" },
  { value: "newborn_care_specialist", label: "Newborn Care Specialist" },
  { value: "postpartum_doula", label: "Postpartum Doula" },
  { value: "registered_nurse", label: "Registered Nurse" },
];

const DURATIONS = [
  { value: "", label: "Any duration" },
  { value: "4", label: "4 hours" },
  { value: "6", label: "6 hours" },
  { value: "8", label: "8 hours" },
  { value: "10", label: "10 hours" },
  { value: "12", label: "12 hours" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProviderSearch() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    provider_type: "",
    min_rate: "",
    max_rate: "",
    availability_day: "",
    availability_time: "",
    duration_hours: "",
    service_type: "",
    distance_miles: "",
  });

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "") params[k] = v;
      });
      const res = await providersApi.browse(params);
      setProviders(res.data);
    } catch (e) {
      setError("Failed to load providers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProviders();
  };

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Find overnight care</h1>
          <p className="text-gray-500">Vetted providers in the DC, Maryland & Virginia area</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSearch} className="mb-6">
          {/* Quick filters row */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {/* Provider type */}
              <div>
                <label className="label text-xs">Provider type</label>
                <select
                  className="input text-sm py-2"
                  value={filters.provider_type}
                  onChange={(e) => setFilter("provider_type", e.target.value)}
                >
                  {PROVIDER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Day of week */}
              <div>
                <label className="label text-xs">Day of week</label>
                <select
                  className="input text-sm py-2"
                  value={filters.availability_day}
                  onChange={(e) => setFilter("availability_day", e.target.value)}
                >
                  <option value="">Any day</option>
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Start time */}
              <div>
                <label className="label text-xs">Start time</label>
                <input
                  type="time"
                  className="input text-sm py-2"
                  value={filters.availability_time}
                  onChange={(e) => setFilter("availability_time", e.target.value)}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="label text-xs">Duration</label>
                <select
                  className="input text-sm py-2"
                  value={filters.duration_hours}
                  onChange={(e) => setFilter("duration_hours", e.target.value)}
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Service type */}
              <div>
                <label className="label text-xs">Service type</label>
                <select
                  className="input text-sm py-2"
                  value={filters.service_type}
                  onChange={(e) => setFilter("service_type", e.target.value)}
                >
                  <option value="">Daytime or overnight</option>
                  <option value="overnight">Overnight only</option>
                  <option value="daytime">Daytime only</option>
                </select>
              </div>
            </div>

            {/* Advanced filters toggle */}
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                className="text-sm text-nova-600 hover:text-nova-700 font-medium"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                {filtersOpen ? "Fewer filters" : "More filters"} ▾
              </button>
              <button type="submit" className="btn-primary py-2 px-5 text-sm">
                Search
              </button>
            </div>

            {/* Advanced filters */}
            {filtersOpen && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="label text-xs">Min rate ($/hr)</label>
                  <input
                    type="number"
                    className="input text-sm py-2"
                    placeholder="Any"
                    value={filters.min_rate}
                    onChange={(e) => setFilter("min_rate", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs">Max rate ($/hr)</label>
                  <input
                    type="number"
                    className="input text-sm py-2"
                    placeholder="Any"
                    value={filters.max_rate}
                    onChange={(e) => setFilter("max_rate", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs">Max distance (miles)</label>
                  <input
                    type="number"
                    className="input text-sm py-2"
                    placeholder="Any"
                    value={filters.distance_miles}
                    onChange={(e) => setFilter("distance_miles", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <LoadingSpinner className="py-20" />
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No providers found</h3>
            <p className="text-gray-500">Try adjusting your filters or expanding your search area.</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">{providers.length} providers found</p>
            <div className="grid md:grid-cols-2 gap-4">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

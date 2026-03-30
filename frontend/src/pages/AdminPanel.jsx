import React, { useState, useEffect } from "react";
import { adminApi } from "../api/client";
import { useAppAuth } from "../context/AuthContext";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const TABS = [
  { key: "providers", label: "Provider Queue" },
  { key: "certifications", label: "Certifications" },
  { key: "users", label: "Users" },
  { key: "arrangements", label: "Arrangements" },
];

const PROVIDER_TYPE_LABELS = {
  babysitter_nanny: "Night Nanny",
  newborn_care_specialist: "NCS",
  postpartum_doula: "Postpartum Doula",
  registered_nurse: "RN",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ProviderDetailModal({ providerId, onClose, onAction }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getProvider(providerId).then(res => {
      setDetail(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [providerId]);

  const approve = async () => {
    await adminApi.approveProvider(providerId);
    onAction();
    onClose();
  };

  const reject = async () => {
    const reason = prompt("Reason for rejection (optional):");
    await adminApi.rejectProvider(providerId, reason);
    onAction();
    onClose();
  };

  const verifyId = async () => {
    await adminApi.verifyProviderId(providerId);
    const res = await adminApi.getProvider(providerId);
    setDetail(res.data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">Provider Application Review</h2>
          <button className="text-gray-400 hover:text-gray-600 text-xl leading-none" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : !detail ? (
          <p className="p-6 text-gray-400 text-center">Failed to load provider details.</p>
        ) : (
          <div className="p-6 space-y-6">
            {/* Identity header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {[detail.first_name, detail.last_name].filter(Boolean).join(" ") || `Provider #${detail.id}`}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{PROVIDER_TYPE_LABELS[detail.provider_type] || detail.provider_type}</p>
              </div>
              <StatusBadge status={detail.status} />
            </div>

            {/* Personal info */}
            <Section title="Personal Information">
              <Grid>
                <Field label="Phone" value={detail.phone_number} />
                <Field label="Date of birth" value={detail.date_of_birth} />
                <Field label="Languages" value={detail.languages_spoken} />
                <Field label="City / State" value={[detail.city, detail.state].filter(Boolean).join(", ")} />
              </Grid>
            </Section>

            {/* Emergency contact */}
            <Section title="Emergency Contact">
              <Grid>
                <Field label="Name" value={detail.emergency_contact_name} />
                <Field label="Phone" value={detail.emergency_contact_phone} />
                <Field label="Relationship" value={detail.emergency_contact_relationship} />
              </Grid>
            </Section>

            {/* Government ID */}
            <Section title="Government ID">
              <div className="space-y-3">
                <Grid>
                  <Field label="ID type" value={detail.id_document_type?.replace("_", " ")} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Verified</span>
                    {detail.id_verified ? (
                      <span className="badge bg-green-50 text-green-700">Yes ✓</span>
                    ) : (
                      <span className="badge bg-amber-50 text-amber-700">No</span>
                    )}
                  </div>
                </Grid>
                {detail.id_document_data ? (
                  <div className="space-y-2">
                    {detail.id_document_data.startsWith("data:image") ? (
                      <img
                        src={detail.id_document_data}
                        alt="Government ID"
                        className="max-w-sm rounded-xl border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <a
                        href={detail.id_document_data}
                        target="_blank"
                        rel="noreferrer"
                        className="text-nova-600 underline text-sm"
                      >
                        View ID document
                      </a>
                    )}
                    {!detail.id_verified && (
                      <button className="btn-primary text-xs py-1.5 px-3 bg-green-600 hover:bg-green-700" onClick={verifyId}>
                        Mark ID as verified
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 font-medium">No ID uploaded</p>
                )}
              </div>
            </Section>

            {/* Professional profile */}
            <Section title="Professional Profile">
              <Grid>
                <Field label="Rate" value={detail.hourly_rate ? `$${detail.hourly_rate}/hr` : null} />
                <Field label="Experience" value={detail.years_experience ? `${detail.years_experience} years` : null} />
                <Field label="Service area" value={detail.service_area_radius_miles ? `${detail.service_area_radius_miles} miles` : null} />
                <Field label="Background check" value={detail.background_check_consent ? "Consented ✓" : "Not consented"} />
                <Field label="Own transport" value={detail.has_own_transport === true ? "Yes" : detail.has_own_transport === false ? "No" : null} />
                <Field label="Special needs exp." value={detail.special_needs_experience === true ? "Yes" : detail.special_needs_experience === false ? "No" : null} />
                <Field label="References" value={detail.references_available === true ? "Available" : detail.references_available === false ? "Not available" : null} />
              </Grid>
              {detail.bio && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed">
                  {detail.bio}
                </div>
              )}
            </Section>

            {/* Certifications */}
            {detail.certifications?.length > 0 && (
              <Section title="Certifications">
                <div className="space-y-2">
                  {detail.certifications.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                      <div>
                        <span className="font-medium">{c.name}</span>
                        {c.issuing_org && <span className="text-gray-400 ml-2">· {c.issuing_org}</span>}
                        {c.year_obtained && <span className="text-gray-400 ml-2">· {c.year_obtained}</span>}
                      </div>
                      {c.verified_by_admin
                        ? <span className="badge bg-green-50 text-green-700 text-xs">Verified</span>
                        : <span className="badge bg-amber-50 text-amber-700 text-xs">Unverified</span>
                      }
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Availability */}
            {detail.availability?.length > 0 && (
              <Section title="Availability">
                <div className="flex flex-wrap gap-2">
                  {detail.availability.map(a => (
                    <span key={a.id} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">
                      {a.day_of_week != null ? DAYS[a.day_of_week] : a.specific_date} · {a.start_time}–{a.end_time}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Action buttons */}
            {detail.status === "pending" && (
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button className="btn-primary flex-1 bg-green-600 hover:bg-green-700" onClick={approve}>
                  Approve provider
                </button>
                <button className="btn-ghost flex-1 text-red-500 border border-red-200 hover:bg-red-50" onClick={reject}>
                  Reject
                </button>
              </div>
            )}
            {detail.rejection_reason && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl p-3">
                Rejection reason: {detail.rejection_reason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-2">{children}</div>;
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-gray-400">{label}</span>
      <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
    </div>
  );
}

export default function AdminPanel() {
  const { dbUser } = useAppAuth();
  const [activeTab, setActiveTab] = useState("providers");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedProviderId, setSelectedProviderId] = useState(null);

  const fetchData = async (tab = activeTab) => {
    setLoading(true);
    try {
      if (tab === "providers") {
        const res = await adminApi.getProviders({ status: statusFilter });
        setData((d) => ({ ...d, providers: res.data }));
      } else if (tab === "certifications") {
        const res = await adminApi.getCertifications({ verified: false });
        setData((d) => ({ ...d, certifications: res.data }));
      } else if (tab === "users") {
        const res = await adminApi.getUsers();
        setData((d) => ({ ...d, users: res.data }));
      } else if (tab === "arrangements") {
        const res = await adminApi.getArrangements();
        setData((d) => ({ ...d, arrangements: res.data }));
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(activeTab); }, [activeTab, statusFilter]);

  const boost = async (id, boosted) => {
    await adminApi.boostProvider(id, boosted);
    fetchData("providers");
  };

  const verifyCert = async (id) => {
    await adminApi.verifyCert(id);
    fetchData("certifications");
  };

  const flagUser = async (id, flagged) => {
    await adminApi.flagUser(id, flagged);
    fetchData("users");
  };

  if (dbUser?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🚫</div>
          <h2 className="text-xl font-bold text-gray-900">Access denied</h2>
          <p className="text-gray-500 mt-1">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 mt-1">Manage providers, certifications, and users</p>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : (
          <>
            {/* Providers */}
            {activeTab === "providers" && (
              <div>
                <div className="flex gap-2 mb-4">
                  {["pending", "approved", "rejected"].map((s) => (
                    <button
                      key={s}
                      className={`btn-ghost text-xs py-1.5 px-3 capitalize ${statusFilter === s ? "bg-nova-100 text-nova-700" : ""}`}
                      onClick={() => setStatusFilter(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  {(data.providers || []).length === 0 ? (
                    <div className="card p-8 text-center text-gray-400">No providers in this queue.</div>
                  ) : (
                    (data.providers || []).map((p) => (
                      <div
                        key={p.id}
                        className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedProviderId(p.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-gray-900">
                                {[p.first_name, p.last_name].filter(Boolean).join(" ") || `Provider #${p.id}`}
                              </span>
                              <span className="badge bg-gray-100 text-gray-600 text-xs">
                                {PROVIDER_TYPE_LABELS[p.provider_type] || p.provider_type}
                              </span>
                              <StatusBadge status={p.status} />
                              {p.is_boosted && <span className="badge bg-amber-50 text-amber-700 text-xs">Boosted</span>}
                              {p.id_verified && <span className="badge bg-green-50 text-green-700 text-xs">ID Verified</span>}
                            </div>
                            <div className="text-sm text-gray-500 space-y-0.5">
                              <p>${p.hourly_rate}/hr · {p.service_area_radius_miles}mi radius</p>
                              {p.bio && <p className="text-gray-400 line-clamp-1">{p.bio}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {p.status === "approved" && (
                              <button
                                className={`text-xs py-1.5 px-3 rounded-lg border ${p.is_boosted ? "border-amber-300 text-amber-600 hover:bg-amber-50" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                                onClick={(e) => { e.stopPropagation(); boost(p.id, !p.is_boosted); }}
                              >
                                {p.is_boosted ? "Remove boost" : "Boost"}
                              </button>
                            )}
                            <span className="text-xs text-nova-600 font-medium">View →</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Certifications */}
            {activeTab === "certifications" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">Showing unverified certifications</p>
                {(data.certifications || []).length === 0 ? (
                  <div className="card p-8 text-center text-gray-400">All certifications verified!</div>
                ) : (
                  (data.certifications || []).map((c) => (
                    <div key={c.id} className="card p-5 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                        <div className="text-xs text-gray-500 mt-0.5 space-x-2">
                          {c.issuing_org && <span>{c.issuing_org}</span>}
                          {c.year_obtained && <span>· {c.year_obtained}</span>}
                          <span>· Provider #{c.provider_id}</span>
                        </div>
                      </div>
                      <button
                        className="btn-primary text-xs py-1.5 px-3 bg-green-600 hover:bg-green-700"
                        onClick={() => verifyCert(c.id)}
                      >
                        Verify
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Users */}
            {activeTab === "users" && (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-600">User</th>
                      <th className="text-left p-4 font-medium text-gray-600">Role</th>
                      <th className="text-left p-4 font-medium text-gray-600">Joined</th>
                      <th className="text-left p-4 font-medium text-gray-600">Status</th>
                      <th className="p-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(data.users || []).map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-gray-900">
                            {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                          </div>
                          <div className="text-gray-400 text-xs">{u.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="badge bg-gray-100 text-gray-600 capitalize">{u.role}</span>
                        </td>
                        <td className="p-4 text-gray-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          {u.is_flagged
                            ? <span className="badge bg-red-50 text-red-600">Flagged</span>
                            : <span className="badge bg-green-50 text-green-600">Active</span>
                          }
                        </td>
                        <td className="p-4 text-right">
                          <button
                            className={`text-xs ${u.is_flagged ? "text-green-600 hover:text-green-700" : "text-red-400 hover:text-red-600"}`}
                            onClick={() => flagUser(u.id, !u.is_flagged)}
                          >
                            {u.is_flagged ? "Unflag" : "Flag"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Arrangements */}
            {activeTab === "arrangements" && (
              <div className="space-y-3">
                {(data.arrangements || []).length === 0 ? (
                  <div className="card p-8 text-center text-gray-400">No arrangements yet.</div>
                ) : (
                  (data.arrangements || []).map((a) => (
                    <div key={a.id} className="card p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Arrangement #{a.id}</span>
                            <StatusBadge status={a.status} />
                          </div>
                          <p className="text-gray-500">
                            Family #{a.family_id} → Provider #{a.provider_id} · {a.start_date} · {a.duration_hours}hrs · ${a.rate_agreed}/hr
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 capitalize">{a.service_type}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Provider detail modal */}
      {selectedProviderId && (
        <ProviderDetailModal
          providerId={selectedProviderId}
          onClose={() => setSelectedProviderId(null)}
          onAction={() => fetchData("providers")}
        />
      )}
    </div>
  );
}

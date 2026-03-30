import React from "react";
import clsx from "clsx";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-green-50 text-green-700",
  completed: "bg-blue-50 text-blue-700",
  cancelled: "bg-gray-100 text-gray-500",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  active: "bg-green-50 text-green-700",
  past_due: "bg-red-50 text-red-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={clsx("badge capitalize", STATUS_STYLES[status] || "bg-gray-100 text-gray-600")}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

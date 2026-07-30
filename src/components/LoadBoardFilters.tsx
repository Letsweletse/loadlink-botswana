import { useState } from "react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "under_2ton", label: "Van / Mini" },
  { key: "medium_7ton", label: "Medium" },
  { key: "big_over_7ton", label: "Big truck" },
];

export default function LoadBoardFilters({ onFilter }: { onFilter?: (k: string) => void }) {
  const [active, setActive] = useState("all");
  return (
    <div className="flex gap-2 overflow-x-auto py-2 -mx-1 px-1">
      {FILTERS.map(f => (
        <button key={f.key}
          onClick={() => { setActive(f.key); onFilter?.(f.key); }}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
            active === f.key ? "bg-[#F97316] border-[#F97316] text-white" : "bg-white border-[#E5E7EB] text-[#6B7280]"
          }`}>
          {f.label}
        </button>
      ))}
    </div>
  );
}

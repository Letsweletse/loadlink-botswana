import { useState } from "react";
import { Plus, X } from "lucide-react";

export default function StopsBuilder({ stops = [], onChange }: { stops?: string[]; onChange?: (s: string[]) => void }) {
  const [list, setList] = useState<string[]>(stops);
  const [val, setVal] = useState("");
  function commit(next: string[]) { setList(next); onChange?.(next); }
  return (
    <div className="space-y-2">
      {list.map((s, i) => (
        <div key={i} className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-xl px-3 h-11">
          <span className="flex-1 text-sm text-[#3D2B0E] truncate">{s}</span>
          <button type="button" onClick={() => commit(list.filter((_, x) => x !== i))}>
            <X className="h-4 w-4 text-[#9CA3AF]" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && val.trim()) { commit([...list, val.trim()]); setVal(""); } }}
          placeholder="Add a stop…"
          className="flex-1 h-11 px-3 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#C9A05A]" />
        <button type="button" onClick={() => { if (val.trim()) { commit([...list, val.trim()]); setVal(""); } }}
          className="h-11 w-11 rounded-xl bg-[#C9A05A] text-white flex items-center justify-center">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

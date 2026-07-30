import { useState } from "react";
import { base44, normalizePhone } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const CATS = [
  { key: "mini", label: "Van / Mini (under 2t)", cap: 2 },
  { key: "medium", label: "Medium truck (2–7t)", cap: 7 },
  { key: "big", label: "Big truck (over 7t)", cap: 15 },
];

export default function VehicleRegistrationForm({ onSaved }: { onSaved?: (v: any) => void }) {
  const { user } = useAuth();
  const [f, setF] = useState({ name: "", plate: "", category: "mini", area: "Gaborone", licence: "", disc: "", permit: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const set = (k: string, v: string) => setF(s => ({ ...s, [k]: v }));

  async function submit(e: any) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!user?.phone) { setErr("Please sign in first."); return; }
    setBusy(true);
    try {
      const v = await base44.entities.Vehicle.create({
        name: f.name.trim(),
        plate: f.plate.trim().toUpperCase(),
        category: f.category,
        area: f.area.trim(),
        phone: normalizePhone(user.phone),
        owner_phone: normalizePhone(user.phone),
        capacity_tonnes: CATS.find(c => c.key === f.category)?.cap ?? 2,
        licence: f.licence.trim() || null,
        disc: f.disc.trim() || null,
        permit: f.permit.trim() || null,
        status: "pending",
      });
      setMsg("Vehicle submitted — pending approval.");
      onSaved?.(v);
    } catch (e: any) { setErr(e.message || "Could not save vehicle."); }
    setBusy(false);
  }

  const inputCls = "w-full h-12 px-3 rounded-xl border border-[#E5E7EB] bg-white text-sm outline-none focus:border-[#C9A05A]";
  const labelCls = "text-xs font-semibold uppercase tracking-wide text-[#6B7280]";

  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{err}</div>}
      {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-xl">{msg}</div>}

      <div><label className={labelCls}>Vehicle name</label>
        <input className={`${inputCls} mt-1.5`} placeholder="Toyota Hilux" value={f.name} onChange={e => set("name", e.target.value)} required /></div>

      <div><label className={labelCls}>Plate number</label>
        <input className={`${inputCls} mt-1.5`} placeholder="B 123 ABC" value={f.plate} onChange={e => set("plate", e.target.value)} required /></div>

      <div><label className={labelCls}>Category</label>
        <div className="grid gap-2 mt-1.5">
          {CATS.map(c => (
            <button key={c.key} type="button" onClick={() => set("category", c.key)}
              className={`h-12 rounded-xl border text-sm font-semibold text-left px-3 ${
                f.category === c.key ? "bg-[#C9A05A] border-[#C9A05A] text-white" : "bg-white border-[#E5E7EB] text-[#3D2B0E]"}`}>
              {c.label}
            </button>
          ))}
        </div></div>

      <div><label className={labelCls}>Operating area</label>
        <input className={`${inputCls} mt-1.5`} value={f.area} onChange={e => set("area", e.target.value)} /></div>

      <div className="grid grid-cols-3 gap-2">
        <div><label className={labelCls}>Licence</label><input className={`${inputCls} mt-1.5`} placeholder="No." value={f.licence} onChange={e => set("licence", e.target.value)} /></div>
        <div><label className={labelCls}>Disc</label><input className={`${inputCls} mt-1.5`} placeholder="No." value={f.disc} onChange={e => set("disc", e.target.value)} /></div>
        <div><label className={labelCls}>Permit</label><input className={`${inputCls} mt-1.5`} placeholder="No." value={f.permit} onChange={e => set("permit", e.target.value)} /></div>
      </div>

      <button type="submit" disabled={busy}
        className="w-full h-12 rounded-xl bg-[#C9A05A] text-white font-bold disabled:opacity-50">
        {busy ? "Saving…" : "Register vehicle"}
      </button>
    </form>
  );
}

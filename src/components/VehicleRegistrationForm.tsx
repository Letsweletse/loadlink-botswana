import { useState } from "react";
import { base44, normalizePhone } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { uploadVehicleDoc } from "@/lib/upload";
import { Camera, Check, Loader2 } from "lucide-react";

const CATS = [
  { key: "mini", label: "Van / Mini (under 2t)", cap: 2 },
  { key: "medium", label: "Medium truck (2–7t)", cap: 7 },
  { key: "big", label: "Big truck (over 7t)", cap: 15 },
  { key: "plant", label: "Plant & machinery", cap: 20 },
];

const LICENCE_CODES = ["B", "C1", "C", "EC1", "EC"];

const inputCls = "w-full h-12 px-3 rounded-xl border border-[#E5E7EB] bg-white text-sm outline-none focus:border-[#C9A05A]";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-[#6B7280]";

function PhotoField({ label, value, onChange, uploading }: {
  label: string; value: string; onChange: (f: File) => void; uploading: boolean;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <label className="mt-1.5 flex items-center gap-3 h-14 px-3 rounded-xl border border-dashed border-[#D8C8A8] bg-[#FFF8EC] cursor-pointer">
        {value ? (
          <img src={value} alt={label} className="h-10 w-10 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin text-[#C9A05A]" /> : <Camera className="h-4 w-4 text-[#B08A45]" />}
          </div>
        )}
        <span className="text-sm text-[#3D2B0E] font-medium truncate">
          {uploading ? "Uploading…" : value ? "Photo added — tap to replace" : "Tap to take or upload photo"}
        </span>
        <input type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
      </label>
    </div>
  );
}

export default function VehicleRegistrationForm({ onSaved, existingVehicle }: { onSaved?: (v: any) => void; existingVehicle?: any }) {
  const { user } = useAuth();
  const v = existingVehicle || {};
  const [f, setF] = useState({
    name: v.name || "", make_model: v.make_model || "", plate: v.plate || "",
    category: v.category || "mini", area: v.area || "Gaborone",
    driver_license_number: v.driver_license_number || "", driver_license_code: v.driver_license_code || "C1",
    driver_license_expiry: v.driver_license_expiry || "",
    ba_permit_number: v.ba_permit_number || "", ba_permit_expiry: v.ba_permit_expiry || "",
    fitness_certificate_expiry: v.fitness_certificate_expiry || "",
    insurance_expiry: v.insurance_expiry || "",
    prdp_expiry: v.prdp_expiry || "",
    disc: v.disc || "",
  });
  const [photos, setPhotos] = useState({
    driver_license_image: v.driver_license_image || "",
    ba_permit_image: v.ba_permit_image || "",
    fitness_certificate_image: v.fitness_certificate_image || "",
    insurance_image: v.insurance_image || "",
    prdp_image: v.prdp_image || "",
    vehicle_photo_front: v.vehicle_photo_front || "",
    vehicle_photo_side: v.vehicle_photo_side || "",
    driver_photo: v.driver_photo || "",
  });
  const [uploadingKey, setUploadingKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const set = (k: string, val: string) => setF(s => ({ ...s, [k]: val }));

  async function handlePhoto(key: string, file: File) {
    setUploadingKey(key);
    try {
      const url = await uploadVehicleDoc(file, `${user?.phone || "vehicle"}/${key}`);
      setPhotos(p => ({ ...p, [key]: url }));
    } catch (e: any) {
      setErr(e.message || "Photo upload failed.");
    }
    setUploadingKey("");
  }

  async function submit(e: any) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!user?.phone) { setErr("Please sign in first."); return; }
    setBusy(true);
    try {
      const payload = {
        name: f.name.trim() || f.make_model.trim(),
        make_model: f.make_model.trim(),
        plate: f.plate.trim().toUpperCase(),
        category: f.category,
        area: f.area.trim(),
        phone: normalizePhone(user.phone),
        owner_phone: normalizePhone(user.phone),
        capacity_tonnes: CATS.find(c => c.key === f.category)?.cap ?? 2,
        driver_license_number: f.driver_license_number.trim() || null,
        driver_license_code: f.driver_license_code,
        driver_license_expiry: f.driver_license_expiry || null,
        ba_permit_number: f.ba_permit_number.trim() || null,
        ba_permit_expiry: f.ba_permit_expiry || null,
        fitness_certificate_expiry: f.fitness_certificate_expiry || null,
        insurance_expiry: f.insurance_expiry || null,
        prdp_expiry: f.prdp_expiry || null,
        disc: f.disc.trim() || null,
        ...photos,
        status: existingVehicle ? existingVehicle.status : "pending",
      };
      const saved = existingVehicle
        ? await base44.entities.Vehicle.update(existingVehicle.id, payload)
        : await base44.entities.Vehicle.create(payload);
      setMsg("Vehicle submitted — pending approval.");
      onSaved?.(saved);
    } catch (e: any) { setErr(e.message || "Could not save vehicle."); }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{err}</div>}
      {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-xl flex items-center gap-2"><Check className="h-4 w-4" />{msg}</div>}

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#B08A45]">Vehicle</p>
        <div><label className={labelCls}>Make & model</label>
          <input className={`${inputCls} mt-1.5`} placeholder="Toyota Hilux" value={f.make_model} onChange={e => set("make_model", e.target.value)} required /></div>
        <div><label className={labelCls}>Nickname (optional)</label>
          <input className={`${inputCls} mt-1.5`} placeholder="e.g. My white bakkie" value={f.name} onChange={e => set("name", e.target.value)} /></div>
        <div><label className={labelCls}>Plate number</label>
          <input className={`${inputCls} mt-1.5`} placeholder="B 123 ABC" value={f.plate} onChange={e => set("plate", e.target.value)} required /></div>
        <div><label className={labelCls}>Category</label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {CATS.map(c => (
              <button key={c.key} type="button" onClick={() => set("category", c.key)}
                className={`h-12 rounded-xl border text-xs font-semibold text-left px-3 ${
                  f.category === c.key ? "bg-[#C9A05A] border-[#C9A05A] text-white" : "bg-white border-[#E5E7EB] text-[#3D2B0E]"}`}>
                {c.label}
              </button>
            ))}
          </div></div>
        <div><label className={labelCls}>Operating area</label>
          <input className={`${inputCls} mt-1.5`} value={f.area} onChange={e => set("area", e.target.value)} /></div>
        <PhotoField label="Vehicle photo — front" value={photos.vehicle_photo_front} uploading={uploadingKey === "vehicle_photo_front"}
          onChange={f => handlePhoto("vehicle_photo_front", f)} />
        <PhotoField label="Vehicle photo — side" value={photos.vehicle_photo_side} uploading={uploadingKey === "vehicle_photo_side"}
          onChange={f => handlePhoto("vehicle_photo_side", f)} />
      </section>

      <section className="space-y-3 pt-2 border-t border-[#E8D5B7]">
        <p className="text-xs font-bold uppercase tracking-wide text-[#B08A45]">Driver</p>
        <PhotoField label="Driver photo" value={photos.driver_photo} uploading={uploadingKey === "driver_photo"}
          onChange={f => handlePhoto("driver_photo", f)} />
        <div><label className={labelCls}>Driving licence number</label>
          <input className={`${inputCls} mt-1.5`} value={f.driver_license_number} onChange={e => set("driver_license_number", e.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls}>Licence code</label>
            <select className={`${inputCls} mt-1.5`} value={f.driver_license_code} onChange={e => set("driver_license_code", e.target.value)}>
              {LICENCE_CODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className={labelCls}>Expiry date</label>
            <input type="date" className={`${inputCls} mt-1.5`} value={f.driver_license_expiry} onChange={e => set("driver_license_expiry", e.target.value)} required /></div>
        </div>
        <PhotoField label="Licence photo" value={photos.driver_license_image} uploading={uploadingKey === "driver_license_image"}
          onChange={f => handlePhoto("driver_license_image", f)} />
        <div><label className={labelCls}>PrDP expiry (if applicable)</label>
          <input type="date" className={`${inputCls} mt-1.5`} value={f.prdp_expiry} onChange={e => set("prdp_expiry", e.target.value)} /></div>
        <PhotoField label="PrDP photo" value={photos.prdp_image} uploading={uploadingKey === "prdp_image"}
          onChange={f => handlePhoto("prdp_image", f)} />
      </section>

      <section className="space-y-3 pt-2 border-t border-[#E8D5B7]">
        <p className="text-xs font-bold uppercase tracking-wide text-[#B08A45]">Compliance documents</p>
        <div><label className={labelCls}>Licence disc number</label>
          <input className={`${inputCls} mt-1.5`} value={f.disc} onChange={e => set("disc", e.target.value)} /></div>
        <div><label className={labelCls}>BA permit number</label>
          <input className={`${inputCls} mt-1.5`} value={f.ba_permit_number} onChange={e => set("ba_permit_number", e.target.value)} /></div>
        <div><label className={labelCls}>BA permit expiry</label>
          <input type="date" className={`${inputCls} mt-1.5`} value={f.ba_permit_expiry} onChange={e => set("ba_permit_expiry", e.target.value)} /></div>
        <PhotoField label="BA permit photo" value={photos.ba_permit_image} uploading={uploadingKey === "ba_permit_image"}
          onChange={f => handlePhoto("ba_permit_image", f)} />
        <div><label className={labelCls}>Fitness certificate expiry</label>
          <input type="date" className={`${inputCls} mt-1.5`} value={f.fitness_certificate_expiry} onChange={e => set("fitness_certificate_expiry", e.target.value)} /></div>
        <PhotoField label="Fitness certificate photo" value={photos.fitness_certificate_image} uploading={uploadingKey === "fitness_certificate_image"}
          onChange={f => handlePhoto("fitness_certificate_image", f)} />
        <div><label className={labelCls}>Insurance expiry</label>
          <input type="date" className={`${inputCls} mt-1.5`} value={f.insurance_expiry} onChange={e => set("insurance_expiry", e.target.value)} /></div>
        <PhotoField label="Insurance photo" value={photos.insurance_image} uploading={uploadingKey === "insurance_image"}
          onChange={f => handlePhoto("insurance_image", f)} />
      </section>

      <button type="submit" disabled={busy || !!uploadingKey}
        className="w-full h-12 rounded-xl bg-[#C9A05A] text-white font-bold disabled:opacity-50">
        {busy ? "Saving…" : existingVehicle ? "Update vehicle" : "Submit for approval"}
      </button>
    </form>
  );
}

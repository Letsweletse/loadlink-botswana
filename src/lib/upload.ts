import { supabase } from "@/lib/supabase";

/** Uploads a file to the vehicle-docs bucket and returns its public URL. */
export async function uploadVehicleDoc(file: File, path: string): Promise<string> {
  if (!supabase) throw new Error("Service unavailable");
  const ext = file.name.split(".").pop() || "jpg";
  const key = `${path}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("vehicle-docs").upload(key, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("vehicle-docs").getPublicUrl(key);
  return data.publicUrl;
}

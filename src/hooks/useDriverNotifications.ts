import { useState } from "react";
export default function useDriverNotifications() {
  const [notifications] = useState<any[]>([]);
  return { notifications };
}

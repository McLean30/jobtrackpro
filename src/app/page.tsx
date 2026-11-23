import { redirect } from "next/navigation";

// Middleware normally handles "/" before this renders; this is a safe fallback.
export default function RootPage() {
  redirect("/overview");
}

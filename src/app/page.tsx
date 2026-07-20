import { redirect } from "next/navigation";

/** Default entry: Module 1 Owner/Director Command Centre */
export default function HomePage() {
  redirect("/dashboard");
}

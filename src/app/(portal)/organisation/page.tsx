import { redirect } from "next/navigation";

/** Legacy alias — HTML nav uses `settings` for Organisation & Access. */
export default function OrganisationAliasPage() {
  redirect("/settings");
}

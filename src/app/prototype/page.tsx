import { redirect } from "next/navigation";

/** Legacy Full HTML entry — redirect to labelled development reference. */
export default function PrototypePage() {
  redirect("/prototype-reference");
}

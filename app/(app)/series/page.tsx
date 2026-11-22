import { redirect } from "next/navigation";

/** Old duplicate of the mock tests catalogue; the public page is the one place for it now. */
export default function SeriesRedirect() {
  redirect("/series/all");
}

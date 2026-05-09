import { redirect } from "next/navigation";

export default function TestsRedirect() {
  redirect("/dashboard/series");
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("faculty_cms_session")?.value;
  redirect(token ? "/dashboard" : "/login");
}

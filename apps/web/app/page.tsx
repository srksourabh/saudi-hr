import { redirect } from "next/navigation";
import { auth } from "@hrms-app/auth";

export default async function RootPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/employees");
  }
  redirect("/login");
}

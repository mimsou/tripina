import { auth } from "@/auth";
import { NewTripClient } from "./new-trip-client";
import { redirect } from "next/navigation";

export default async function NewTripPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/trip/new");
  }
  return <NewTripClient />;
}

import { TripBuilder } from "@/components/trip/trip-builder";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) notFound();
  if (trip.creatorId !== session.user.id) redirect(`/trip/${id}`);

  return <TripBuilder tripId={id} />;
}

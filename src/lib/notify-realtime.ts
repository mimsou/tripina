/** Notify the realtime server to push a Socket.io event (Railway). */
export async function notifyJoinRequest(payload: {
  creatorId: string;
  tripId: string;
  tripTitle: string;
  requesterName: string | null;
  requesterId: string;
  memberId: string;
}) {
  const url = process.env.REALTIME_INTERNAL_URL;
  const secret = process.env.REALTIME_SECRET;
  if (!url || !secret) return;

  try {
    await fetch(`${url.replace(/\/$/, "")}/internal/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        event: "join:request",
        userId: payload.creatorId,
        payload: {
          tripId: payload.tripId,
          tripTitle: payload.tripTitle,
          requesterName: payload.requesterName,
          requesterId: payload.requesterId,
          memberId: payload.memberId,
        },
      }),
    });
  } catch {
    /* optional service */
  }
}

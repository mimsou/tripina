/**
 * Socket.io + Fastify service for Railway.
 * Run: npm run realtime
 */
import cors from "@fastify/cors";
import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });
const port = Number(process.env.REALTIME_PORT ?? 4001);
const secret = process.env.REALTIME_SECRET ?? "dev-secret-change-me";

void (async () => {
  await fastify.register(cors, { origin: true });

  let io!: Server;

  fastify.post("/internal/emit", async (request, reply) => {
    const auth = request.headers.authorization;
    if (auth !== `Bearer ${secret}`) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const body = request.body as {
      event: string;
      userId: string;
      payload: Record<string, unknown>;
    };
    const { event, userId, payload } = body;
    io.to(`user:${userId}`).emit(event, payload);
    return { ok: true };
  });

  await fastify.ready();
  io = new Server(fastify.server, {
    cors: { origin: process.env.NEXTAUTH_URL ?? true, methods: ["GET", "POST"] },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.sessionToken as string | undefined;
    if (!token) {
      return next(new Error("Unauthorized"));
    }
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
    });
    if (!session || session.expires < new Date()) {
      return next(new Error("Unauthorized"));
    }
    socket.data.userId = session.userId;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    void socket.join(`user:${userId}`);
    socket.emit("ready", { userId });
  });

  await fastify.listen({ port, host: "0.0.0.0" });
  console.log(`Realtime listening on ${port}`);
})();

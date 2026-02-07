import { createServer } from "http";
import { buildApp } from "./http/app.js";
import { env } from "./env.js";
import { connectMongo } from "./db/mongo.js";
import { attachSocketServer } from "./realtime/socket.js";

async function main() {
  await connectMongo(env.MONGO_URL);

  const app = buildApp();
  const httpServer = createServer(app);
  attachSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`backend listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


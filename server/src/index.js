import { createApp } from "./app.js";
import { connectMongo } from "./config/db.js";
import { env } from "./config/env.js";
import { attachSocketServer } from "./socket.js";

const app = createApp();

connectMongo().then(() => {
  const server = app.listen(env.PORT, () => {
    console.log(JSON.stringify({ status: "ok", service: "agenthire-server", port: env.PORT }));
  });
  attachSocketServer(server);

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(JSON.stringify({
        status: "error",
        service: "agenthire-server",
        message: `Port ${env.PORT} is already in use. Stop the existing server or change PORT in server/.env.`,
        port: env.PORT,
        timestamp: new Date().toISOString()
      }));
      process.exit(1);
    }
    throw error;
  });
});

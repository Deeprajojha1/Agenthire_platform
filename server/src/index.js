import { createApp } from "./app.js";
import { connectMongo } from "./config/db.js";
import { env } from "./config/env.js";

const app = createApp();

connectMongo().then(() => {
  app.listen(env.PORT, () => {
    console.log(JSON.stringify({ status: "ok", service: "agenthire-server", port: env.PORT }));
  });
});

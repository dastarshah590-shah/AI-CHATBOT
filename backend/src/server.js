import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectDB, isMongoConnected } from "./config/db.js";
import { seedDefaultData } from "./services/seedService.js";
import { chatSocket } from "./sockets/chatSocket.js";

const PORT = process.env.PORT || 5000;
const clientOrigins = (process.env.CLIENT_URL || "http://localhost:3000,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

await connectDB();
global.smartbotStorageMode = isMongoConnected() ? "mongodb" : "memory";
await seedDefaultData();

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: clientOrigins,
    credentials: true
  }
});

app.set("io", io);
chatSocket(io);

server.listen(PORT, () => {
  console.log(`SmartBot AI API listening on http://localhost:${PORT}`);
});

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const open = require("open").default;
const { Server } = require("socket.io");
const qrcode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { getReplyAsJeet, setRuntimeApiKey, getApiKey } = require("./gpt");

const API_KEY_COOKIE = "jeet_api_key";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

const FILES_FOLDER = path.join(__dirname, "files");
const PORT = process.env.PORT || 3000;

// Ensure files folder exists
if (!fs.existsSync(FILES_FOLDER)) {
  fs.mkdirSync(FILES_FOLDER, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FILES_FOLDER),
  filename: (req, file, cb) => {
    const base = (file.originalname || `chat-${Date.now()}.txt`).replace(/[^a-zA-Z0-9._-]/g, "_") || "chat.txt";
    cb(null, base);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === "text/plain" || (file.originalname && file.originalname.toLowerCase().endsWith(".txt"));
    cb(ok ? null : new Error("Only .txt files allowed"), ok);
  },
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.cookies && req.cookies[API_KEY_COOKIE] && !getApiKey()) {
    setRuntimeApiKey(req.cookies[API_KEY_COOKIE]);
  }
  next();
});
const clientDist = path.join(__dirname, "client", "dist");
const publicDir = path.join(__dirname, "public");
const staticDir = fs.existsSync(clientDist) ? clientDist : publicDir;
app.use(express.static(staticDir));

app.get("/", (req, res) => {
  const indexPath = fs.existsSync(clientDist)
    ? path.join(clientDist, "index.html")
    : path.join(publicDir, "index.html");
  res.sendFile(indexPath);
});

app.get("/api/config", (req, res) => {
  let hasChats = false;
  let hasClosestPerson = false;
  try {
    if (fs.existsSync(FILES_FOLDER)) {
      const files = fs.readdirSync(FILES_FOLDER).filter((f) => f.endsWith(".txt"));
      hasChats = files.length > 0;
      hasClosestPerson = files.includes("closest-person.txt");
    }
  } catch (_) { }
  res.json({ hasApiKey: !!getApiKey(), hasChats, hasClosestPerson });
});

app.post("/api/clear-key", (req, res) => {
  setRuntimeApiKey(null);
  res.clearCookie(API_KEY_COOKIE);
  res.json({ ok: true });
});

app.post("/api/set-key", (req, res) => {
  const key = req.body && req.body.apiKey;
  if (!key || typeof key !== "string" || !key.trim()) {
    return res.status(400).json({ ok: false, error: "API key is required" });
  }
  const trimmed = key.trim();
  setRuntimeApiKey(trimmed);
  res.cookie(API_KEY_COOKIE, trimmed, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  res.json({ ok: true });
});

app.get("/api/chats", (req, res) => {
  try {
    if (!fs.existsSync(FILES_FOLDER)) {
      return res.json({ files: [] });
    }
    const files = fs
      .readdirSync(FILES_FOLDER)
      .filter((f) => f.endsWith(".txt"))
      .map((f) => ({ name: f, isClosest: f === "closest-person.txt" }));
    res.json({ files });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/upload-chat", upload.single("chat"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "No file uploaded. Choose a .txt chat export." });
  }
  const asClosest = req.body && (req.body.asClosest === "true" || req.body.asClosest === true);
  let filename = req.file.filename;
  if (asClosest) {
    const targetPath = path.join(FILES_FOLDER, "closest-person.txt");
    try {
      fs.renameSync(req.file.path, targetPath);
      filename = "closest-person.txt";
    } catch (err) {
      return res.status(500).json({ ok: false, error: "Failed to save as closest-person chat." });
    }
  }
  res.json({
    ok: true,
    filename,
    asClosest: !!asClosest,
    message: asClosest
      ? "Chat saved as your closest-person reference. Replies will match this style most closely."
      : "Chat uploaded. It will be used as additional style reference.",
  });
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", async (qr) => {
  try {
    const dataUrl = await qrcode.toDataURL(qr, { margin: 2, width: 280 });
    io.emit("qr", { dataUrl });
  } catch (err) {
    console.error("QR to image error:", err.message);
  }
});

let isReady = false;

client.on("ready", () => {
  isReady = true;
  io.emit("ready");
});

io.on("connection", (socket) => {
  if (isReady) socket.emit("ready");
});

client.on("message", async (msg) => {
  const text = (msg.body || "").trim();

  let fromName = msg.from;
  try {
    const contact = await msg.getContact();
    fromName = contact.name || contact.pushname || contact.shortName || msg.from;
  } catch (_) { }

  const payload = {
    id: (msg.id && msg.id._serialized) ? msg.id._serialized : `${msg.from}-${Date.now()}`,
    from: msg.from,
    fromName: fromName || msg.from,
    body: msg.body || "",
    timestamp: msg.timestamp,
    hasMedia: msg.hasMedia,
  };

  io.emit("message", payload);

  // Never reply to status updates (replies would go to status)
  if (msg.isStatus) return;

  // Only reply in personal (direct) chats, not in groups or status
  let isPrivate = false;
  try {
    const chat = await msg.getChat();
    const chatId = (chat.id && chat.id._serialized) ? chat.id._serialized : String(chat.id || "");
    const isStatusChat = /status@broadcast|@\w*broadcast\b/.test(chatId);
    isPrivate = !chat.isGroup && !isStatusChat;
  } catch (_) { }
  if (!isPrivate) return;

  if (!text) return;

  if (!getApiKey()) {
    await msg.reply("Bot is not configured: add your OpenAI API key in the web app first.");
    return;
  }

  try {
    const reply = await getReplyAsJeet(FILES_FOLDER, text);
    await msg.reply(reply || "👍");
  } catch (err) {
    console.error("Jeet reply error:", err.message);
    await msg.reply("Something went wrong, try again in a bit.");
  }
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Web app: ${url}`);
  open(url).catch(() => { });
  client.initialize();
});

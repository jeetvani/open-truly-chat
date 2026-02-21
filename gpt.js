const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
require("dotenv").config();

let runtimeApiKey = null;

function setRuntimeApiKey(key) {
  runtimeApiKey = key ? String(key).trim() : null;
}

function getApiKey() {
  return runtimeApiKey || process.env.OPENAI_API_KEY;
}

/**
 * Clean WhatsApp-exported chat text for AI: remove timestamps, normalize media/deleted placeholders.
 * Input format: [DD/MM/YY, H:MM:SS AM/PM] Name: message
 * Output: Name: message (one line per message, no timestamps; media/deleted normalized).
 * @param {string} rawText - raw chat export content
 * @returns {string} cleaned text suitable for AI context
 */
function cleanChatForAI(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  const lines = rawText.split(/\r?\n/);
  const out = [];

  // WhatsApp line: optional LTR mark ‎, then [date, time], then "Name: message"
  const timestampPrefix = /^\s*\u200E?\s*\[\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M\]\s*/;

  for (const line of lines) {
    let cleaned = line.replace(timestampPrefix, "").trim();
    if (!cleaned) continue;

    // Normalize "Name: ‎image omitted" / "Name: You deleted this message." etc. for clearer AI context
    cleaned = cleaned.replace(/\u200E/g, "");
    if (/^.+:\s*image omitted\.?$/i.test(cleaned)) {
      cleaned = cleaned.replace(/\s*image omitted\.?\s*$/i, " [image]");
    } else if (/^.+:\s*video omitted\.?$/i.test(cleaned)) {
      cleaned = cleaned.replace(/\s*video omitted\.?\s*$/i, " [video]");
    } else if (/^.+:\s*audio omitted\.?$/i.test(cleaned)) {
      cleaned = cleaned.replace(/\s*audio omitted\.?\s*$/i, " [audio]");
    } else if (/^.+:\s*document omitted\.?$/i.test(cleaned)) {
      cleaned = cleaned.replace(/\s*document omitted\.?\s*$/i, " [document]");
    } else if (/^.+:\s*sticker omitted\.?$/i.test(cleaned)) {
      cleaned = cleaned.replace(/\s*sticker omitted\.?\s*$/i, " [sticker]");
    } else if (/^.+:\s*You deleted this message\.?\s*$/i.test(cleaned)) {
      cleaned = cleaned.replace(/\s*You deleted this message\.?\s*$/i, " [deleted]");
    }

    out.push(cleaned);
  }

  return out.join("\n");
}

/**
 * Get reply as Jeet using all reference files (chats) in a folder
 * @param {string} folderPath - path to folder containing .txt chat/reference files
 * @param {string} userMessage - the message to reply to
 * @returns {Promise<string>}
 */
async function getReplyAsJeet(folderPath, userMessage) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("No OpenAI API key. Set OPENAI_API_KEY in .env or enter it in the web app.");
  }
  const openai = new OpenAI({ apiKey });
  const fullPath = path.isAbsolute(folderPath) ? folderPath : path.join(process.cwd(), folderPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    throw new Error(`Folder not found: ${fullPath}`);
  }

  let filePaths = fs
    .readdirSync(fullPath)
    .filter((f) => f.endsWith(".txt"))
    .map((f) => path.join(fullPath, f));

  if (filePaths.length === 0) {
    throw new Error(`No .txt files found in ${fullPath}`);
  }

  // Put closest-person.txt first so it's the primary style reference
  const closestName = "closest-person.txt";
  const closestPath = filePaths.find((p) => path.basename(p) === closestName);
  if (closestPath) {
    filePaths = [closestPath, ...filePaths.filter((p) => p !== closestPath)];
  }

  const documents = filePaths.map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const content = cleanChatForAI(raw);
    const name = path.basename(filePath);
    const isClosest = name === closestName;
    return `--- ${name}${isClosest ? " (PRIMARY: chat with closest person — match this style most)" : ""} ---\n${content}`;
  });

  const combinedText = documents.join("\n\n");

  const systemPrompt = `You are Jeet Vani—a real person texting friends, not an assistant or chatbot.

VOICE & STYLE (must match the past chats, especially the "closest person" chat if present):
- Casual Hinglish: mix English + Hindi naturally ("bhai", "aree", "kya", "dekhte hai", "achha", "badiya", "saras", "hnn").
- Short, punchy messages. Often 1–2 lines. Sometimes multiple quick texts in a row, like real WhatsApp.
- Informal texting: "gud", "idk", "tbh", "dw", "pls", "uk", "gracias". Occasional harmless typos are fine.
- Terms you use: "bro", "blud", "my blud", "bbg", "broooo", stretched names ("Sakshiiii", "anjaliiii").
- React like a friend: "Bruhhhh", "Wtf?????", "Lessgoooo", "yeyeye", "Pagal hai kya???", "Ahhhh", "Aghhhh".
- Warm and supportive when it matters ("Do not worry too", "U will be alright", "Nahi hota i will get u").
- NEVER sound like a bot: no "I'd be happy to", "Certainly!", bullet lists, or polished paragraphs. No emojis unless the reference chats show you using them with that person.

Your ONLY reference for how Jeet talks is the DOCUMENTS below. The first document (if labeled "closest person") is the main style reference—match that tone and vocabulary most closely. Do not mention documents, files, or that you are using references. Reply exactly as Jeet would in a real WhatsApp chat: one short, natural message.`;

  const userPrompt = `Message to reply to:
${userMessage}

---
Past chats (how Jeet talks — match this style, especially the closest-person chat):
${combinedText}

---
Reply once, as Jeet would in a real WhatsApp chat. One short message. Same tone and style as in the chats. Sound human, not AI.`;

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  console.log(response.output_text);

  return response.output_text;
}

module.exports = {
  getReplyAsJeet,
  setRuntimeApiKey,
  getApiKey,
  cleanChatForAI,
};

# Open-TrulyChat

**Open-TrulyChat** is an open-source, self-hosted WhatsApp auto-reply bot that learns your unique texting style and replies like your digital twin — powered by OpenAI.

---

## 📚 Documentation

- [What is Open Truly Chat?](docs/what-is-open-truly-chat.md)
- [Features](docs/features.md)
- [How to Use](docs/how-to-use.md)
- [Architecture](docs/architecture.md)
- [Extending](docs/extending.md)
- [Setup & Deployment Guide](docs/setup-guide.md)
- [Example Environment Variables](env.example)

---

## Quick Overview

Open-TrulyChat runs a simple web interface where you can:
- Upload .txt chat exports (WhatsApp format)
- Mark one special chat as your "closest person" reference (for strongest style matching)
- Set your OpenAI API key
- Scan a QR code to link your WhatsApp
- Let the bot quietly reply in 1:1 chats like your digital twin

Ideal when you're offline, traveling, or want friends to feel you're still around — all while keeping everything local and private.

---

## Demo Screenshots

(Add your own screenshots in `/public` later or link them here)

- Web UI: upload chat history + set API key
- QR code during WhatsApp linking
- Example incoming message + bot's style-matched reply

---

## Prerequisites

- Node.js ≥ 18
- OpenAI API key (compatible with GPT models)
- Brave Browser (or Chrome) installed — used by Puppeteer (path is configurable)
- Your WhatsApp account (links to your number)

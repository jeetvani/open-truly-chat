# Open-TrulyChat

**Open-TrulyChat** is an **open-source**, self-hosted WhatsApp auto-reply bot that learns **your** unique texting style from exported chat histories (especially from your closest conversations) and replies in a way that feels authentically like you — powered by OpenAI.

It runs a simple web interface where you can:
- Upload .txt chat exports (WhatsApp format)
- Mark one special chat as your "closest person" reference (for strongest style matching)
- Set your OpenAI API key
- Scan a QR code to link your WhatsApp
- Let the bot quietly reply in 1:1 chats like your digital twin

Ideal when you're offline, traveling, or want friends to feel you're still around — all while keeping everything local and private.

## Features

- **Style imitation** — Draws from your real chat history (especially "closest-person.txt") to match tone, emojis, slang, message length, quirks, etc.
- **Private chats only** — Ignores groups and status messages
- **Web dashboard** — Upload chats, configure API key, monitor connection
- **QR login** using whatsapp-web.js + persistent sessions (LocalAuth)
- **Safe file uploads** — .txt only, 10 MB limit, sanitized filenames
- **Real-time feedback** — Socket.io for QR code, ready status, and incoming messages
- **Graceful fallbacks** — Polite errors when no API key or something fails

## Demo Screenshots

(Add your own screenshots in `/public` later or link them here)

- Web UI: upload chat history + set API key
- QR code during WhatsApp linking
- Example incoming message + bot's style-matched reply

## Prerequisites

- Node.js ≥ 18
- OpenAI API key (compatible with GPT models)
- Brave Browser (or Chrome) installed — used by Puppeteer (path is configurable)
- Your WhatsApp account (links to **your** number)

## Installation

1. Clone the repository

   ```bash
   git clone https://github.com/YOUR_USERNAME/Open-TrulyChat.git
   cd Open-TrulyChat
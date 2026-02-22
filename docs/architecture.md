# Architecture Overview

Open Truly Chat uses a client-server architecture:

- **Server:** Node.js backend handles WhatsApp connection, chat logic, and AI replies.
- **Client:** React + Vite frontend provides the web dashboard for uploads, settings, and monitoring.

## How WhatsApp & AI Work Together
- The server connects to WhatsApp using whatsapp-web.js (via QR code).
- When a message arrives, the bot uses OpenAI (GPT) to generate a reply in your style.
- Replies are sent back to WhatsApp automatically.

## Folder Structure
- `/client`: Frontend code (React, Vite)
- `/public`: Static assets
- `index.js`, `gpt.js`: Backend entry points

---

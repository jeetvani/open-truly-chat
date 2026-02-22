# Setup & Deployment Guide

## 1. Clone the Repository
```bash
git clone https://github.com/jeetvani/open-truly-chat.git
cd open-truly-chat
```

## 2. Set Up Environment Variables
- Copy `env.example` to `.env`:
  ```bash
  cp env.example .env
  ```
- Edit `.env` and add your OpenAI API key, WhatsApp session path, browser path, and port.

## 3. Install Dependencies
```bash
npm install
cd client && npm install
```

## 4. Start the Server & Client
```bash
npm run start
cd client && npm run dev
```

## 5. Deploying
- You can deploy on Heroku, Railway, VPS, or any Node.js hosting.
- Make sure to set environment variables in your deployment platform.
- For production, build the client:
  ```bash
  cd client
  npm run build
  ```
- Serve the built files with a static server or integrate with your backend.

---

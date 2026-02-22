# How to Use Open Truly Chat

## Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/jeetvani/open-truly-chat.git
   cd open-truly-chat
   ```
2. Set up your environment variables:
   - Copy `env.example` to `.env` and fill in your OpenAI API key, WhatsApp session path, browser path, and port.
3. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```
4. Start the server and client:
   ```bash
   npm run start
   cd client && npm run dev
   ```

## Using the App
1. Open your browser and go to `http://localhost:5000`.
2. Upload your WhatsApp chat history (.txt files).
3. Set your OpenAI API key in the dashboard.
4. Scan the QR code to link your WhatsApp account.
5. Mark your closest person’s chat for best style matching.
6. The bot will start replying to private messages for you, in your style.

---

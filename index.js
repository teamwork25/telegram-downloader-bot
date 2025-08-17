require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const ytdlp = require("yt-dlp-exec");
const fs = require("fs");
const axios = require("axios");
const express = require("express");
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Keep alive for Railway / Replit
const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Send me a YouTube or Instagram link to download!");
});

// Handle messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || !text.startsWith("http")) return;

  try {
    // --- YouTube ---
    if (text.includes("youtube.com") || text.includes("youtu.be")) {
      bot.sendMessage(chatId, "Downloading YouTube video...");
      const output = "video.mp4";

      await ytdlp(text, { 
        output, 
        format: "best[height<=720]" // limit resolution to 720p
      });

      if (fs.existsSync(output)) {
        await bot.sendDocument(chatId, fs.createReadStream(output));
        fs.unlinkSync(output);
      } else {
        bot.sendMessage(chatId, "Failed to download YouTube video.");
      }

    } 
    // --- Instagram ---
    else if (text.includes("instagram.com")) {
      bot.sendMessage(chatId, "Downloading Instagram video...");

      const response = await axios.get(
        `https://api.sosmods.com/v1/instagram?url=${text}`,
        { responseType: "arraybuffer" }
      );
      const filePath = "insta.mp4";
      fs.writeFileSync(filePath, response.data);

      if (fs.existsSync(filePath)) {
        await bot.sendDocument(chatId, fs.createReadStream(filePath));
        fs.unlinkSync(filePath);
      } else {
        bot.sendMessage(chatId, "Failed to download Instagram video.");
      }

    } 
    // --- Unsupported ---
    else {
      bot.sendMessage(chatId, "Unsupported link. Only YouTube or Instagram URLs are allowed.");
    }

  } catch (err) {
    console.error("Error downloading/sending video:", err);
    bot.sendMessage(chatId, "Error downloading video. Please try again.");
  }
});
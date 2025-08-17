require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const ytdlp = require("yt-dlp-exec");
const fs = require("fs");
const axios = require("axios");
const express = require("express");
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Keep alive for Railway
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(process.env.PORT || 3000);

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
    if (text.includes("youtube.com") || text.includes("youtu.be")) {
      bot.sendMessage(chatId, "Downloading YouTube video...");
      const output = `video.mp4`;

      await ytdlp(text, { output });

      await bot.sendVideo(chatId, fs.createReadStream(output));
      fs.unlinkSync(output);

    } else if (text.includes("instagram.com")) {
      bot.sendMessage(chatId, "Downloading Instagram video...");

      // Free Instagram downloader API
      const res = await axios.get(
        `https://api.sosmods.com/v1/instagram?url=${text}`,
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync("insta.mp4", res.data);

      await bot.sendVideo(chatId, fs.createReadStream("insta.mp4"));
      fs.unlinkSync("insta.mp4");

    } else {
      bot.sendMessage(chatId, "Unsupported link.");
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Error downloading video.");
  }
});
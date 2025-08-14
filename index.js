import { Client, GatewayIntentBits } from "discord.js";
import http from "http";

// Render 用 HTTPサーバー
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.write("OK");
  res.end();
}).listen(PORT, () => console.log(`Server listening on ${PORT}`));

// Discordクライアント作成
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Bot準備完了
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// メッセージ受信テスト
client.on("messageCreate", message => {
  if (message.author.bot) return;
  if (message.content === "ping") {
    message.reply("pong");
  }
});

// 環境変数からトークン取得してログイン
(async () => {
  try {
    console.log("TOKEN length:", process.env.TOKEN?.length); // 0やundefinedなら読み込まれていない
    await client.login(process.env.TOKEN);
    console.log("✅ Login success");
  } catch (err) {
    console.error("❌ Login failed:", err);
  }
})();

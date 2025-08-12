const { Client, GatewayIntentBits, Partials } = require("discord.js");
const axios = require("axios");
const { Readable } = require("stream");
const vm = require("vm");
const http = require("http");
http.createServer(function(req, res){
    res.write("OK");
    res.end();
}).listen(8080);

const DATABASE_CHANNEL_ID = "1402999086331990221";

let userdata = { monnku: 0 };

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

async function loadUserData() {
  try {
    const channel = await client.channels.fetch(DATABASE_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      return;
    }
    const messages = await channel.messages.fetch({ limit: 1 });
    const lastMessage = messages.first();
    if (lastMessage && lastMessage.attachments.size > 0) {
      const attachment = lastMessage.attachments.first();
      if (attachment.name === "userdata.json" && attachment.url) {
        const response = await axios.get(attachment.url);
        userdata = response.data;
      }
    }
  } catch (error) {}
}

async function saveUserData() {
  try {
    const channel = await client.channels.fetch(DATABASE_CHANNEL_ID);
    if (channel && channel.isTextBased()) {
      await channel.send({
        content: "userdata.jsonを更新しました。",
        files: [{ attachment: Readable.from(JSON.stringify(userdata)), name: "userdata.json" }],
      });
    }
  } catch (error) {}
}

async function runAsyncCode(code, context, timeout) {
  try {
    const wrappedCode = `
      (async () => {try{
        ${code}}catch(err){return null;}
      })()
    `;
    const script = new vm.Script(wrappedCode);
    const result = await script.runInNewContext(context, { timeout });
    return result;
  } catch (err) {
    return null;
  }
}

client.once("ready", async () => {
  await loadUserData();
  setInterval(saveUserData, 1000 * 60 * 15);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "もんう") {
    userdata.monnku++;
    message.reply(`もんう　もんう${userdata.monnku}`);
    return;
  }

  if (message.content.startsWith("oasuta")) {
    const prompt = message.content;
    try {
      if (true) {
        const response = await axios.post(
          "https://api.ai21.com/studio/v1/chat/completions",
          {
            model: "jamba-large",
            max_tokens: 512,
            messages: [
              {
                role: "system",
                content: `${process.env.system} 入力はdiscord.jsのmessageCreateのメッセージで、メッセージに対応するdiscord.jsのmessageCreateのコードのみ出力してください。 clientオブジェクトとmessageオブジェクトが取得できます。 embedは使わないでください。 axiosは認証不要のapiを使ってください。`,
              },
              { role: "user", content: prompt },
            ],
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.ai21}`,
              "Content-Type": "application/json",
            },
          }
        );
        const match = response.data.choices[0].message.content.match(/```javascript\n[\s\S]*?\n([\s\S]*?)}\);\n```/);
        if (match) {
          console.log(match[1]);
          const context = {
            message,
            client,
            setTimeout,
            axios,
            require: (mod) => {
              if (mod === "discord.js") {
                return discord;
              } else if (mod === "axios") {
                return axios;
              } else {
                new Error("Module not allowed");
              }
            },
          };
          await runAsyncCode(match[1], context, 10000);
        } else {
        }
      }
    } catch (error) {
      message.reply("エラーが発生しました。");
    }
  }
});

client.login(process.env.token);

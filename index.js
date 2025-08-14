import { Client, GatewayIntentBits, Partials } from "discord.js";
import axios from "axios";
import fetch from "node-fetch";
import { Readable } from "stream";
import vm from "vm";
import http from "http";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
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
  const modelclient = ModelClient(
    "https://models.github.ai/inference",
    new AzureKeyCredential(process.env.github),
  );
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
      message.content = message.content.slice("oasuta".length);
    const prompt = message.content;
    try {
      if (true) {
  const response = await modelclient.path("/chat/completions").post({
    body: {
      messages: [
          { role:"system", content: "Discord.js code only" },
          { role: "user", content: `if (message.content === '${prompt}') { ... }` }
      ],
      model: "openai/gpt-4.1"
    }
  });
          console.log(response.body.choices[0].message.content);
        const match = response.body.choices[0].message.content.match(/```[\s\S]*?\n([\s\S]*?)\n```/);
        if (match) {
          const context = {
            message,
            client,
            setTimeout,
            axios,
            fetch,
            require: (mod) => {
if (mod === "discord.js"){return discord}else if(mod === "axios"){return axios}else if(mod === "node-fetch"){return fetch}else{new Error("Module not allowed");};

  }
          };
          await runAsyncCode(match[1], context, 10000);
        }
      }
    } catch (error) {
      message.reply("エラーが発生しました。");
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.commandName === "chat") {
        await interaction.deferReply();
      interaction.commandName = interaction.options.getString("content");
    const prompt = interaction.commandName;
    try {
      if (true) {
  const response = await modelclient.path("/chat/completions").post({
    body: {
      messages: [
          { role:"system", content: "Discord.js code only" },
          { role: "user", content: `await interaction.deferReply();\nif (interaction.commandName === '${prompt}') { ... }` }
      ],
      model: "openai/gpt-4.1"
    }
  });
          console.log(response.body.choices[0].message.content);
        const match = response.body.choices[0].message.content.match(/```[\s\S]*?\n([\s\S]*?)\n```/);
        if (match) {
          const context = {
            interaction,
            client,
            setTimeout,
            axios,
            fetch,
            require: (mod) => {
if (mod === "discord.js"){return discord}else if(mod === "axios"){return axios}else if(mod === "node-fetch"){return fetch}else{new Error("Module not allowed");};

  }
          };
          await runAsyncCode(match[1].replace(/await interaction.deferReply\(\);/g, ""), context, 10000);
        }
      }
    } catch (error) {
      interaction.reply("エラーが発生しました。");
    }
  }
});
console.log("About to login");
client.login(process.env.token);

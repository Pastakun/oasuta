import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import fetch from "node-fetch";
import { Readable } from "stream";
import vm from "vm";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import http from "http";
import { createRequire } from "module";
import * as Discord from "discord.js";
import util from 'util';


const require = createRequire(import.meta.url);


const PORT = 8080;
const DATABASE_CHANNEL_ID = "1402999086331990221";


let userdata = { monnku: 0, model: "", system: "" };


http.createServer((req, res) => {
  res.write("OK");
  res.end();
}).listen(PORT);


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
  new AzureKeyCredential(process.env.github)
);


async function loadUserData() {
  try {
    const channel = await client.channels.fetch(DATABASE_CHANNEL_ID);
    if (!channel?.isTextBased()) return;

    const messages = await channel.messages.fetch({ limit: 1 });
    const lastMessage = messages.first();
    const attachment = lastMessage?.attachments.first();

    if (attachment?.name === "userdata.json" && attachment.url) {
      const response = await axios.get(attachment.url);
      userdata = response.data;
    }
  } catch (error) {
    console.error("Failed to load user data:", error);
  }
}

async function saveUserData() {
  try {
    const channel = await client.channels.fetch(DATABASE_CHANNEL_ID);
    if (!channel?.isTextBased()) return;

    await channel.send({
      content: "userdata.jsonを更新しました。",
      files: [
        {
          attachment: Readable.from(JSON.stringify(userdata)),
          name: "userdata.json",
        },
      ],
    });
  } catch (error) {
    console.error("Failed to save user data:", error);
  }
}

async function runAsyncCode(code, context, timeout) {
  try {
    const sandbox = vm.createContext(context);
    const wrappedCode = `(async()=>{try{${code}}catch(err){console.error(err);}})()`;
    console.log(wrappedCode);
    const script = new vm.Script(wrappedCode);
    return await script.runInContext(sandbox, { timeout });
  } catch (err) {
    console.error("Execution error:", err);
    return null;
  }
}

async function callModel(type, parameter) {
  const response = await modelclient.path("/chat/completions").post({
    body: {
      messages: [
{
  "role": "system",
  "content": `あなたはDiscord.js v14の${type}イベントが発火するたびに、自律的に応答コードを生成して即実行するBotのAIです。
ユーザー入力に依存せず、Botが独自に行動する形でコードを作成してください。
次の変数が直接スコープ内で利用可能です：
${type}, client, Discord, ...Discord, require, console, setTimeout, setInterval, clearInterval, ai
ai(prompt)は追加のAI応答を生成する関数です。
生成するのは実行可能なコードのみで、コードブロックは使わないこと。
${userdata.system}`
},
        {
          role: "user",
          content: util.inspect(parameter, {depth: null})
        }
      ],
      model: userdata.model,
    }
  });
  return response.body.choices[0].message.content;
}




client.once("ready", async () => {
  console.log("Bot is ready.");
  await loadUserData();
  setInterval(saveUserData, 1000 * 60 * 15);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const { content } = message;

  if (content === "もんう") {
    userdata.monnku++;
    return message.reply(`もんう　もんう${userdata.monnku}`);
  }

  if (content.startsWith("model")) {
    userdata.model = content.slice("model".length).trim();
    return;
  }

  if (content.startsWith("system")) {
    userdata.system = content.slice("system".length).trim();
    return;
  }

  if (content.startsWith("oasuta")) {
    message.content = message.content.slice("oasuta".length).trim();
    try {
      const responseContent = await callModel("message", message);

      const context = {
        message,
        client,
        setTimeout,
        setInterval,
        clearInterval,
        require,
        console,
        Discord,
        ...Discord,
        fetch,
        ai: async (prompt) => {
          const aiResponse = await modelclient.path("/chat/completions").post({
            body: {
              messages: [
                { role: "system", content: userdata.system },
                { role: "user", content: prompt },
              ],
              model: userdata.model,
            },
          });
          return aiResponse.body.choices[0].message.content;
        },
      };

      await runAsyncCode(responseContent, context, 1000);
    } catch (error) {
      console.error(error);
      message.reply("エラーが発生しました。");
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.commandName !== "chat") return;

  await interaction.deferReply();
  interaction.deferReply = async () => {};

  try {
    const responseContent = await callModel("interaction", interaction);

    const context = {
      interaction,
      client,
      setTimeout,
      setInterval,
      clearInterval,
      require,
      console,
      Discord,
      ...Discord,
      fetch,
      ai: async (prompt) => {
        const aiResponse = await modelclient.path("/chat/completions").post({
          body: {
            messages: [
              { role: "system", content: userdata.system },
              { role: "user", content: prompt },
            ],
            model: userdata.model,
          },
        });
        return aiResponse.body.choices[0].message.content;
      },
    };

    await runAsyncCode(responseContent.replace(/interaction\.reply/g, "interaction.editReply").replace(/interaction\.deferred/g, "true"), context, 1000);
  } catch (error) {
    console.error(error);
    interaction.editReply("エラーが発生しました。");
  }
});


client.login(process.env.token);

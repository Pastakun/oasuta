import { Client, GatewayIntentBits, Partials } from "discordlatest";
import axios from "axios";
import fetch from "node-fetch";
import { Readable } from "stream";
import vm from "vm";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import http from "http";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import * as Discord from 'discord.js';

http.createServer(function(req, res){
    res.write("OK");
    res.end();
}).listen(8080);

const DATABASE_CHANNEL_ID = "1402999086331990221";

let userdata = { monnku: 0 , model: "", system: ""};

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
        files: [
          {
            attachment: Readable.from(JSON.stringify(userdata)),
            name: "userdata.json",
          },
        ],
      });
    }
  } catch (error) {}
}

async function runAsyncCode(code, context, timeout) {
  try {
    const sandbox = vm.createContext(context);
    const wrappedCode = `
      (async () => {
        try {
          ${code}
        } catch (err) {
          console.error(err);
        }
      })()
    `;
    const script = new vm.Script(wrappedCode);
    const result = script.runInContext(sandbox, { timeout });
    return await result;
  } catch (err) {
    console.error(err);
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
  if (message.content.startsWith("model")) {
      userdata.model = message.content.slice("model".length);
  }
  if (message.content.startsWith("system")) {
      userdata.system = message.content.slice("system".length);
  }
  if (message.content.startsWith("oasuta")) {
    message.content = message.content.slice("oasuta".length);
    const prompt = message.content;
    try {
      if (true) {
        const response = await modelclient.path("/chat/completions").post({
          body: {
            messages: [
              { role: "system", content: "Fill `...` in Discord.js v14. Code only.必要に応じて `ai(prompt)` を非同期で呼んでください。" + userdata.system },
              {
                role: "user",
                content: `if(message.content==='${prompt}'){...}`,
              },
            ],
            model: userdata.model,
          },
        });
        console.log(response.body.choices[0].message.content);
const matches = [...response.body.choices[0].message.content.matchAll(
  /```[\s\S]*?\n([\s\S]*?)\n```/g
)].map(m => m[1]);
          const context = {
            message,
            client,
            setTimeout,
            setInterval,
            clearInterval,
            require,
            console,
            fetch,
            Discord,
            ...Discord,
            ai: async function(content){const response =  await modelclient.path("/chat/completions").post({
          body: {
            messages: [
                { role: "system", content: userdata.system },
              { role: "user", content }
            ],
            model: userdata.model,
          },
        });
            return response.body.choices[0].message.content;
          }
          };
          if (matches.length > 0) {
  await runAsyncCode(matches.join("\n"), context, 1000);
}else{
await runAsyncCode(response.body.choices[0].message.content, context, 1000);
}
      }
    } catch (error) {
    console.log(error);
      message.reply("エラーが発生しました。");
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.commandName === "chat") {
    await interaction.deferReply();
    const prompt = interaction.options.getString("content");
    try {
      if (true) {
        const response = await modelclient.path("/chat/completions").post({
          body: {
            messages: [
              { role: "system", content: "Fill `...` in Discord.js v14. Code only.必要に応じて `ai(prompt)` を非同期で呼んでください。" + userdata.system },
              {
                role: "user",
                content: `if(interaction.commandName==='chat'){await interaction.deferReply();if(interaction.options.getString("content")==='${prompt}'){...}}`,
              },
            ],
            model: userdata.model,
          },
        });
        console.log(response.body.choices[0].message.content);
const matches = [...response.body.choices[0].message.content.matchAll(
  /```[\s\S]*?\n([\s\S]*?)\n```/g
)].map(m => m[1]);
          const context = {
            interaction,
            client,
            setTimeout,
            setInterval,
            clearInterval,
            require,
            console,
            fetch,
            Discord,
            ...Discord,
            ai: async function(content){const response =  await modelclient.path("/chat/completions").post({
          body: {
            messages: [
                { role: "system", content: userdata.system },
              { role: "user", content }
            ],
            model: userdata.model,
          },
        });
            return response.body.choices[0].message.content;
          }
          };
          if (matches.length > 0) {
  await runAsyncCode(matches.join("\n").replace(/await interaction.deferReply\(\);/g, ""), context, 1000);
}else{
await runAsyncCode(response.body.choices[0].message.content.replace(/await interaction.deferReply\(\);/g, ""), context, 1000);
}
      }
    } catch (error) {
        console.log(error);
      interaction.editReply("エラーが発生しました。");
    }
  }
});
client.login(process.env.token);

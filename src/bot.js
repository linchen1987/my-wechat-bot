import "dotenv-flow/config";
import { WechatyBuilder, ScanStatus } from "wechaty";
import { PuppetWechat4u } from "wechaty-puppet-wechat4u";
import QrCodeTerminal from "qrcode-terminal";

import { openai } from "./openai.js";
import * as cache from "./redis.js";
import bio from "./bio.js";
import {
  getUsedCount,
  increaseUsedCount,
  getCurrentDate,
} from "./states/tokens.js";
import { insertMessage } from "./states/messages.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const puppet = new PuppetWechat4u();

const expireInSeconds = 5 * 60;
const maxUsedTokenCountPerDay =
  Number(process.env.MAX_TOKEN_COUNT_PER_DAY) || 1e5;

const wechaty = WechatyBuilder.build({
  name: "linchen-robot",
  puppet,
});

const getResponse = async (text, messages) => {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: bio,
      },
      ...messages,
      {
        role: "user",
        content: text,
      },
    ],
    model: "gpt-3.5-turbo-0125",
  });
  return {
    text: completion.choices[0].message.content,
    usedTokenCount: completion.usage?.total_tokens || 0,
  };
};

wechaty
  .on("scan", (qrcode, status) => {
    const qrcodeImageUrl = [
      "https://wechaty.js.org/qrcode/",
      encodeURIComponent(qrcode),
    ].join("");

    console.log(`Scan QR Code to login: ${status}\n${qrcodeImageUrl}`);

    if (status === ScanStatus.Waiting) {
      QrCodeTerminal.generate(qrcode, { small: true }); // show qrcode on console
    }
  })
  .on("login", async (user) => {
    console.log(`User ${user} logged in`);

    try {
    } catch (error) {
      console.error(error);
    }
  })
  .on("logout", (user, reason) => {
    console.info(`${user} logout, reason: ${reason}`);
  })
  .on("message", async (message) => {
    console.info("on message", message.toString());
    const messageText = (await message.mentionText()) || message.text();
    const messageType = message.type();
    const isMeToMe = message.listener()?.id === message.talker().id;
    const isSideByMe = message.self();
    const isInRoom = !!message.room();
    const isSayToMe =
      !isInRoom && wechaty.currentUser?.id === message.listener()?.id;
    const isMentionMeInRoom = isInRoom && (await message.mentionSelf());

    if (isSideByMe || isMeToMe) {
      return;
    }

    try {
      let sender;
      if (isSayToMe) {
        sender = message.talker();
      } else if (isMentionMeInRoom) {
        sender = message.room();
      }

      if (!sender) {
        return;
      }

      const talker = message.talker();
      const talkerId = message.talker().id;
      const talkerName = message.talker().name();

      if (talker.type() === wechaty.Contact.Type.Official) {
        return;
      }

      if ((talkerName || "").includes("微信")) {
        return;
      }

      if (messageType !== wechaty.Message.Type.Text) {
        await sender.say("我暂时只能处理文字消息");
        return;
      }

      const date = getCurrentDate();
      const usedCount = await getUsedCount({ date });
      if (usedCount >= maxUsedTokenCountPerDay) {
        await sender.say("我今天消耗的 token 太多了，抱歉，明天在来吧～");
        return;
      }

      console.log("begin replying to", talkerName, talkerId, message.id);
      const id = `linkBot:messages:${sender.id}-${talkerId}`;
      const messages = await cache.getLastTenItems(id);
      const response = await getResponse(messageText, messages);
      let text = response.text;
      if (isInRoom) {
        text = `@${talkerName} ${text}`;
      }
      await sender.say(text);
      console.log("replied to", talkerName, talkerId, message.id);

      const newMessages = [
        {
          role: "user",
          content: messageText,
        },
        {
          role: "assistant",
          content: response.text,
        },
      ];
      await cache.pushItems(id, newMessages, expireInSeconds);

      // update states in background
      (async () => {
        try {
          await increaseUsedCount({ date, count: response.usedTokenCount });
          await insertMessage({
            roomName: isInRoom ? await message.room().topic() : null,
            talkerName,
            message: messageText,
            usedTokenCount: response.usedTokenCount,
          });
        } catch (error) {
          console.error(error);
        }
      })();
    } catch (error) {
      console.error(error);
    }
  })
  // room
  .on("room-invite", async (roomInvitation) => {
    console.log(`on room-invite`);
  })
  .on("room-join", (room, inviteeList, inviter, date) => {
    console.log(
      `on room-join, room:${room}, inviteeList:${inviteeList}, inviter:${inviter}, date:${date}`
    );
  })
  .on("room-leave", (room, leaverList, remover, date) => {
    console.log(
      `on room-leave, room:${room}, leaverList:${leaverList}, remover:${remover}, date:${date}`
    );
  })
  .on("room-topic", (room, newTopic, oldTopic, changer, date) => {
    console.log(
      `on room-topic, room:${room}, newTopic:${newTopic}, oldTopic:${oldTopic}, changer:${changer}, date:${date}`
    );
  })
  // friend
  .on("friendship", (friendship) => {
    console.log(`on friendship: ${friendship}`);
    console.log(friendship.contact()?.name());
    switch (friendship.type()) {
      case wechaty.Friendship.Type.Receive:
        friendship
          .accept()
          .then(async () => {
            friendship
              .contact()
              .say("你好，我是 Link 的数字分身，很高兴认识你");
            await sleep(1000);
            friendship
              .contact()
              .say(
                "你可以问我任何问题 😊\n⚠️注意：我的大号能看到聊天信息，请不包含要个人隐私哦～"
              );
          })
          .catch((e) => console.error(e));
        break;
      case wechaty.Friendship.Type.Confirm:
        console.log(
          `friend event confirmed with ${friendship.contact()?.name()}`
        );
        break;
    }
  })
  .on("error", (error) => {
    console.error(`on error: ${error}`);
  });

wechaty.start().then(() => {
  console.log("wechaty started");
});

export default wechaty;

import { messages } from "../db/schema.js";
import db from "../db/drizzle.js";

export async function insertMessage({
  roomName,
  talkerName,
  message,
  usedTokenCount,
}) {
  await db.insert(messages).values({
    roomName,
    talkerName,
    message,
    usedTokenCount,
  });
}

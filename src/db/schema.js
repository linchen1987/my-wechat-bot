import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomName: text("room_name"),
  talkerName: text("talker_name"),
  message: text("message"),
  usedTokenCount: integer("used_token_count"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usedTokens = pgTable("used_tokens", {
  id: serial("id").primaryKey(),
  date: text("date"),
  usedCount: integer("used_count"),
  createdAt: timestamp("created_at").defaultNow(),
});

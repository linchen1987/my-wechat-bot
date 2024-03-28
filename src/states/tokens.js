import { eq, sql } from "drizzle-orm";
import { usedTokens } from "../db/schema.js";
import db from "../db/drizzle.js";

/**
 * Get Date
 * format: 2024-03-03
 *
 * @return: string
 */
export const getCurrentDate = () => {
  const date = new Date();
  let month = date.getMonth() + 1;
  month = month < 10 ? "0" + month : month;
  let day = date.getDate();
  day = day < 10 ? "0" + day : day;
  return `${date.getFullYear()}-${month}-${day}`;
};

export async function upsertUsedCount({ date: inputDate, count }) {
  const date = inputDate || getCurrentDate();
  const usedCount = count || 0;
  const exist = await db.query.usedTokens.findFirst({
    where: eq(usedTokens.date, date),
  });

  if (exist) {
    await db
      .update(usedTokens)
      .set({ usedCount })
      .where(eq(usedTokens.date, date));
    return;
  }
  await db.insert(usedTokens).values({ date, usedCount });
}

export async function increaseUsedCount({ date: inputDate, count }) {
  const date = inputDate || getCurrentDate();
  const usedCount = count || 0;
  const exist = await db.query.usedTokens.findFirst({
    where: eq(usedTokens.date, date),
  });

  if (exist) {
    await db
      .update(usedTokens)
      .set({ usedCount: sql`${usedTokens.usedCount} + ${usedCount}` })
      .where(eq(usedTokens.date, date));
    return;
  }
  await db.insert(usedTokens).values({ date, usedCount });
}

export async function getUsedCount({ date }) {
  const data = await db.query.usedTokens.findFirst({
    where: eq(usedTokens.date, date),
  });
  return data?.usedCount || 0;
}

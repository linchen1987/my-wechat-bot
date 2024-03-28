import { createClient } from "redis";

let _client;

const getClient = async () => {
  if (!_client) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    _client = await createClient({
      url,
    })
      .on("error", (err) => console.log("Redis Client Error", err))
      .connect();
  }
  return _client;
};

async function getLastTenItems(key) {
  const client = await getClient();
  const items = await client.lRange(key, -10, -1);
  return items.map((item) => JSON.parse(item));
}

async function pushItems(key, values, expire = 30) {
  const client = await getClient();
  for (const value of values) {
    await client.rPush(key, JSON.stringify(value));
  }

  await client.lTrim(key, -10, -1);
  if (expire > 0) {
    await client.expire(key, expire);
  }
}

export { getLastTenItems, pushItems };

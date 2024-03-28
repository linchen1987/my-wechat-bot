import "dotenv/config";

export default {
  schema: "./src/db/schema.js",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL,
  },
};

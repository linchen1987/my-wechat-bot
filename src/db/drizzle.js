import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.POSTGRES_URL;

const client = postgres(connectionString);
const db = drizzle(client, { schema });

export default db;

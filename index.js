import "dotenv-flow/config";

import bot from "./src/bot.js";
import initServer from "./src/server.js";

initServer(bot);

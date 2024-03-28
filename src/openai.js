import OpenAI from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";

if (!process.env.OPENAI_API_KEY) {
  console.error("Please set OPENAI_API_KEY environment variable");
}

if (process.env.https_proxy) {
  console.log("Using https_proxy", process.env.https_proxy);
}

const openai = new OpenAI({
  httpAgent: process.env.https_proxy
    ? new HttpsProxyAgent(process.env.https_proxy || "")
    : undefined,
  apiKey: process.env.OPENAI_API_KEY,
});

export { openai };

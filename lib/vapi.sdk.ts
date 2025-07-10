// /lib/vapi.sdk.ts
import  Vapi  from "@vapi-ai/web";

let vapi: Vapi;

if (typeof window !== "undefined") {
  const apiKey = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN as string;
  console.log("VAPI TOKEN", process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN);


  if (!apiKey) {
    throw new Error("Vapi API Key is missing in environment variables");
  }

  vapi = new Vapi(apiKey);
}

export { vapi };

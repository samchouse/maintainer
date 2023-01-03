import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { App, createNodeMiddleware } from "https://esm.sh/octokit@2.0.7";
import { serve } from "https://deno.land/std@0.157.0/http/mod.ts";
import { EmitterWebhookEventWithStringPayloadAndSignature } from "https://esm.sh/v95/@octokit/webhooks@10.1.5/dist-types/types.d.ts";

const config = {
  appId: Deno.env.get("APP_ID"),
  privateKey: Deno.env.get("PRIVATE_KEY"),
  webhooks: {
    secret: Deno.env.get("WEBHOOK_SECRET"),
  },
  oauth: {
    clientId: Deno.env.get("CLIENT_ID"),
    clientSecret: Deno.env.get("CLIENT_SECRET"),
  },
};

if (
  !config.appId || !config.privateKey || !config.webhooks.secret ||
  !config.oauth.clientId || !config.oauth.clientSecret
) {
  throw new Error("Missing environment variables");
}

const app = new App({
  appId: config.appId,
  privateKey: config.privateKey,
  webhooks: {
    secret: config.webhooks.secret,
  },
  oauth: {
    clientId: config.oauth.clientId,
    clientSecret: config.oauth.clientSecret,
  },
});

app.webhooks.on("installation.created", (e) => {
  console.log("i.c", e);
});

app.webhooks.onAny((event) => {
  console.log(event);
});

await serve(async (req) => {
  const body = await req.text();

  await app.webhooks.verifyAndReceive({
    id: req.headers.get("x-github-delivery") ?? "",
    name: req.headers.get(
      "x-github-event",
    ) as EmitterWebhookEventWithStringPayloadAndSignature["name"] ?? "",
    signature: req.headers.get("x-hub-signature-256") ?? "",
    payload: body,
  });

  return new Response("ok");
}, { port: 3000 });

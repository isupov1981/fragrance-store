import { unsubscribeByToken } from "@/lib/newsletter/subscribers";

export const runtime = "nodejs";

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: Georgia, serif; background: #f7f3ec; color: #201d19; margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 2rem; }
      main { max-width: 28rem; text-align: center; }
      h1 { font-size: 1.75rem; font-weight: 500; margin: 0 0 1rem; }
      p { line-height: 1.6; color: rgba(32,29,25,.7); margin: 0; }
      a { color: #201d19; }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${body}</p>
      <p style="margin-top:1.5rem"><a href="/en">Return to the atelier</a></p>
    </main>
  </body>
</html>`;
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return new Response(
      htmlPage("Unsubscribe", "This unsubscribe link is missing or incomplete."),
      { status: 400, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  const subscriber = await unsubscribeByToken(token);
  if (!subscriber) {
    return new Response(
      htmlPage("Unsubscribe", "We could not find a subscription for this link."),
      { status: 404, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  return new Response(
    htmlPage(
      "You are unsubscribed",
      "You will no longer receive new-arrival notes from Privé Atelier. You can subscribe again from the website footer at any time.",
    ),
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

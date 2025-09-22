// Vercel Serverless Function: проксирует OAuth в GigaChat NGW:9443
import https from "https";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // переносим нужные заголовки 1:1
  const headers = {
    "Authorization": req.headers["authorization"] || "",
    "RqUID": req.headers["rquid"] || genUuid(),
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json"
  };

  // читаем тело (scope=GIGACHAT_API_PERS)
  const body = await readRawBody(req);

  // ВАЖНО: отключаем строгую проверку сертификата на origin 9443
  const agent = new https.Agent({ rejectUnauthorized: false });

  // делаем запрос к NGW
  const resp = await fetch("https://ngw.devices.sberbank.ru:9443/api/v2/oauth", {
    method: "POST",
    headers,
    body,
    agent
  }).catch(e => ({
    ok: false,
    status: 502,
    text: () => Promise.resolve(JSON.stringify({ error: String(e) }))
  }));

  const text = await resp.text();
  res.status(resp.status || 502)
    .setHeader("Content-Type", "application/json")
    .send(text);
}

function genUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", ch => (data += ch));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

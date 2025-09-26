import https from "https";
import fetch from "node-fetch";

/**
 * Прокси к https://gigachat.devices.sberbank.ru/api/v1/chat/completions
 * Принимает POST с JSON телом (messages, model, temperature),
 * пересылает заголовок Authorization: Bearer ...
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    // переносим нужные заголовки 1:1
    const headers = {
      "Authorization": req.headers["authorization"] || "",
      "RqUID": req.headers["rquid"] || genUuid(),
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const body = await readRawBody(req);

    // На всякий случай отключаем жёсткую проверку TLS (как и для 9443)
    const agent = new https.Agent({ rejectUnauthorized: false });

    const resp = await fetch("https://gigachat.devices.sberbank.ru/api/v1/chat/completions", {
      method: "POST",
      headers,
      body,
      agent
    });

    const text = await resp.text();
    res.status(resp.status).setHeader("Content-Type", "application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
}

function genUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random()*16)|0, v = c==="x" ? r : (r&0x3)|0x8;
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

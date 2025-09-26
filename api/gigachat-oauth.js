import https from "https";
import fetch from "node-fetch";

/**
 * Прокси к https://ngw.devices.sberbank.ru:9443/api/v2/oauth
 * Принимает POST с body: "scope=GIGACHAT_API_PERS"
 * Пересылает заголовки Authorization и RqUID.
 * Отключаем строгую проверку TLS на 9443 (rejectUnauthorized:false),
 * т.к. Google Apps Script не может ходить туда напрямую.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const headers = {
      "Authorization": req.headers["authorization"] || "",
      "RqUID": req.headers["rquid"] || genUuid(),
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    };

    const body = await readRawBody(req);
    const agent = new https.Agent({ rejectUnauthorized: false });

    const resp = await fetch("https://ngw.devices.sberbank.ru:9443/api/v2/oauth", {
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

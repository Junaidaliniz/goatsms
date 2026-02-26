const express = require("express");
const http = require("http");
const zlib = require("zlib");
const querystring = require("querystring");

const router = express.Router();

const CONFIG = {
  baseUrl: "http://51.89.99.105/NumberPanel",
  username: "Junaidali786",
  password: "Junaidali786",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
};

let cookies = [];

/* ================= REQUEST FUNCTION ================= */
function request(method, url, data = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": CONFIG.userAgent,
      "Cookie": cookies.join("; "),
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Accept-Encoding": "gzip, deflate",
      ...extraHeaders
    };

    if (method === "POST" && data) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      headers["Content-Length"] = Buffer.byteLength(data);
    }

    const req = http.request(url, { method, headers }, res => {
      if (res.headers["set-cookie"]) {
        res.headers["set-cookie"].forEach(c => {
          const cookie = c.split(";")[0];
          if (!cookies.includes(cookie)) cookies.push(cookie);
        });
      }

      let chunks = [];
      res.on("data", d => chunks.push(d));
      res.on("end", () => {
        let buffer = Buffer.concat(chunks);
        if (res.headers["content-encoding"] === "gzip") {
          try { buffer = zlib.gunzipSync(buffer); } catch(e) {}
        }
        resolve(buffer.toString());
      });
    });

    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

/* ================= LOGIN LOGIC ================= */
async function login() {
  cookies = []; 
  // 1. Get Captcha
  const page = await request("GET", `${CONFIG.baseUrl}/login`);
  const match = page.match(/(\d+)\s*\+\s*(\d+)/);
  const captcha = match ? (parseInt(match[1]) + parseInt(match[2])) : 10;

  // 2. Post Credentials
  const postData = querystring.stringify({
    username: CONFIG.username,
    password: CONFIG.password,
    capt: captcha
  });

  await request("POST", `${CONFIG.baseUrl}/signin`, postData, {
    "Referer": `${CONFIG.baseUrl}/login`,
    "Origin": "http://51.89.99.105"
  });
}

/* ================= CLEAN HTML TAGS ================= */
function cleanData(data) {
  try {
    const json = JSON.parse(data);
    if (json.aaData) {
      json.aaData = json.aaData.map(row => 
        row.map(cell => String(cell || "").replace(/<[^>]+>/g, "").trim())
      );
    }
    return json;
  } catch (e) {
    return { error: "Invalid JSON response", raw: data.substring(0, 100) };
  }
}

/* ================= API ROUTE ================= */
router.get("/", async (req, res) => {
  const { type } = req.query;
  if (!type) return res.json({ error: "Use ?type=numbers or ?type=sms" });

  try {
    await login();
    
    let targetUrl = "";
    let referer = "";

    if (type === "numbers") {
      targetUrl = `${CONFIG.baseUrl}/client/res/data_smsnumbers.php?sEcho=2&iDisplayLength=-1&_=${Date.now()}`;
      referer = `${CONFIG.baseUrl}/client/MySMSNumbers`;
    } else {
      const today = new Date().toISOString().split('T')[0];
      targetUrl = `${CONFIG.baseUrl}/client/res/data_smscdr.php?fdate1=${today}%2000:00:00&fdate2=${today}%2023:59:59&iDisplayLength=100&_=${Date.now()}`;
      referer = `${CONFIG.baseUrl}/client/SMSCDRReports`;
    }

    const rawResponse = await request("GET", targetUrl, null, {
      "Referer": referer,
      "X-Requested-With": "XMLHttpRequest"
    });

    res.json(cleanData(rawResponse));

  } catch (err) {
    res.status(500).json({ error: "Script Error", details: err.message });
  }
});

module.exports = router;

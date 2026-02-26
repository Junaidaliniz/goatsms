const express = require("express");
const http = require("http");
const zlib = require("zlib");
const querystring = require("querystring");

const router = express.Router();

const CONFIG = {
  baseUrl: "http://51.89.99.105/NumberPanel",
  username: "Junaidali786", // Aapka diya hua ID
  password: "Junaidali786", // Aapka diya hua Password
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

let cookies = [];

/* ================= REQUEST ENGINE ================= */
function request(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": CONFIG.userAgent,
      "Cookie": cookies.join("; "),
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    };

    if (method === "POST" && data) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      headers["Content-Length"] = Buffer.byteLength(data);
    }

    const req = http.request(url, { method, headers }, res => {
      // Cookie handling
      if (res.headers["set-cookie"]) {
        res.headers["set-cookie"].forEach(c => {
          const cookie = c.split(";")[0];
          cookies.push(cookie);
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
  cookies = []; // Reset cookies for fresh login
  const page = await request("GET", `${CONFIG.baseUrl}/login`);
  
  // Math Captcha Solve: "What is 10 + 5 = ?"
  const match = page.match(/(\d+)\s*\+\s*(\d+)/);
  const captchaResult = match ? (parseInt(match[1]) + parseInt(match[2])) : 0;

  const postData = querystring.stringify({
    username: CONFIG.username,
    password: CONFIG.password,
    capt: captchaResult
  });

  // Client panel login endpoint usually /signin
  await request("POST", `${CONFIG.baseUrl}/signin`, postData);
}

/* ================= API ROUTE ================= */
router.get("/", async (req, res) => {
  const { type } = req.query;
  if (!type) return res.json({ error: "Use ?type=numbers or ?type=sms" });

  try {
    await login();
    
    let url = "";
    if (type === "numbers") {
      url = `${CONFIG.baseUrl}/client/res/data_smsnumbers.php?sEcho=2&iDisplayLength=-1&_=${Date.now()}`;
    } else if (type === "sms") {
      const d = new Date().toISOString().split('T')[0];
      url = `${CONFIG.baseUrl}/client/res/data_smscdr.php?fdate1=${d}%2000:00:00&fdate2=${d}%2023:59:59&iDisplayLength=100&_=${Date.now()}`;
    }

    const responseData = await request("GET", url);
    res.json(JSON.parse(responseData));

  } catch (err) {
    res.status(500).json({ error: "Server Error", details: err.message });
  }
});

module.exports = router;

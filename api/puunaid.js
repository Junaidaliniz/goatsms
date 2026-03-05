const http = require("http");
const querystring = require("querystring");
const zlib = require("zlib");

const CONFIG = {
  baseUrl: "http://85.195.94.50",
  username: "junaidaliniz",
  password: "Junaid123"
};

let sessionCookies = [];

function request(method, url, data = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate",
      ...extraHeaders
    };
    
    if (sessionCookies.length > 0) {
      headers["Cookie"] = sessionCookies.join("; ");
    }

    if (method === "POST" && data) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      headers["Content-Length"] = Buffer.byteLength(data).toString();
    }

    const req = http.request(url, { method, headers }, res => {
      if (res.headers["set-cookie"]) {
        res.headers["set-cookie"].forEach(c => {
          const cookie = c.split(";")[0];
          const key = cookie.split("=")[0];
          sessionCookies = sessionCookies.filter(ck => !ck.startsWith(key + "="));
          sessionCookies.push(cookie);
        });
      }

      let chunks = [];
      res.on("data", d => chunks.push(d));
      res.on("end", () => {
        let buffer = Buffer.concat(chunks);
        try {
          if (res.headers["content-encoding"] === "gzip")
            buffer = zlib.gunzipSync(buffer);
        } catch {}
        resolve({
          status: res.statusCode || 500,
          headers: res.headers,
          body: buffer.toString()
        });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function login() {
  console.log("Fetching login page...");
  const pageRes = await request("GET", `${CONFIG.baseUrl}/sms/SignIn`);
  
  const match = pageRes.body.match(/(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
  const ans = match ? Number(match[1]) + Number(match[2]) : 10;
  console.log(`Solved captcha: ${ans}`);

  const form = querystring.stringify({
    username: CONFIG.username,
    password: CONFIG.password,
    capt: ans.toString()
  });

  console.log("Logging in...");
  await request("POST", `${CONFIG.baseUrl}/sms/signmein`, form, { Referer: `${CONFIG.baseUrl}/sms/SignIn` });
  
  // Finalize session
  await request("GET", `${CONFIG.baseUrl}/sms/index.php`);
  console.log("Login successful.");
}

function cleanHtml(str) {
  if (typeof str !== "string") return String(str || "");
  return str.replace(/<[^>]+>/g, "").trim();
}

async function getNumbers() {
  const url = `${CONFIG.baseUrl}/sms/reseller/ajax/dt_numbers.php?sEcho=1&iDisplayStart=0&iDisplayLength=500`;
  const res = await request("GET", url, null, {
    "X-Requested-With": "XMLHttpRequest",
    "Referer": `${CONFIG.baseUrl}/sms/reseller/`
  });
  const data = JSON.parse(res.body);
  return data.aaData ? data.aaData.map(row => row.map(cleanHtml)) : [];
}

async function getSMS() {
  const now = new Date().toISOString().split("T")[0];
  const url = `${CONFIG.baseUrl}/sms/reseller/ajax/dt_reports.php?fdate1=${now}%2000:00:00&fdate2=${now}%2023:59:59&sEcho=1&iDisplayStart=0&iDisplayLength=500`;
  const res = await request("GET", url, null, {
    "X-Requested-With": "XMLHttpRequest",
    "Referer": `${CONFIG.baseUrl}/sms/reseller/`
  });
  const data = JSON.parse(res.body);
  return data.aaData ? data.aaData.map(row => row.map(cleanHtml)) : [];
}

async function run() {
  try {
    await login();
    
    console.log("\n--- Numbers ---");
    const numbers = await getNumbers();
    console.table(numbers.slice(0, 10)); // Show first 10
    
    console.log("\n--- SMS Reports ---");
    const sms = await getSMS();
    console.table(sms.slice(0, 10)); // Show first 10
    
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();

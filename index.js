const express = require("express");
const app = express();

// 1. Dono API files ko yahan import karein
const junaid = require("./api/junaid");   // file: api/junaid.js
const pjunaid = require("./api/pjunaid"); // file: api/pjunaid.js

const PORT = process.env.PORT || 3000;

// 2. Dono ko alag-alag paths par set karein
app.use("/junaid", junaid);   // Iska URL hoga: server-url.com/junaid?type=sms
app.use("/pjunaid", pjunaid); // Iska URL hoga: server-url.com/pjunaid?type=sms

// Default Check
app.get("/", (req, res) => {
  res.json({ 
    message: "Dono APIs online hain!",
    endpoints: ["/junaid", "/pjunaid"]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

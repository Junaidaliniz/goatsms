const express = require("express");
const app = express();

// 1. Teeno API files ko yahan import karein
const junaid = require("./api/junaid");   
const pjunaid = require("./api/pjunaid"); 
const njunaid = require("./api/njunaid"); // Nayi file yahan add hui

const PORT = process.env.PORT || 3000;

// 2. Teeno ko alag-alag paths par set karein
app.use("/junaid", junaid);   
app.use("/pjunaid", pjunaid); 
app.use("/njunaid", njunaid); // Iska URL hoga: .../njunaid?type=sms

// Default Check Page
app.get("/", (req, res) => {
  res.json({ 
    status: "Success",
    message: "Teeno APIs online hain!",
    links: {
        junaid: "/junaid?type=sms",
        pjunaid: "/pjunaid?type=sms",
        njunaid: "/njunaid?type=sms"
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

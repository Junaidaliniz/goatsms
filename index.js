const express = require("express");
const app = express();

// 1. Saari API files ko yahan import karein
const junaid = require("./api/junaid");   
const pjunaid = require("./api/pjunaid"); 
const njunaid = require("./api/njunaid"); 
const timejunaid = require("./api/timejunaid"); // Nayi file 1
const pujunaid = require("./api/pujunaid");     // Nayi file 2

const PORT = process.env.PORT || 3000;

// 2. Sabko alag-alag paths par set karein
app.use("/junaid", junaid);   
app.use("/pjunaid", pjunaid); 
app.use("/njunaid", njunaid);
app.use("/timejunaid", timejunaid); // Iska URL: /timejunaid?type=sms
app.use("/pujunaid", pujunaid);     // Iska URL: /pujunaid?type=sms

// Default Check Page
app.get("/", (req, res) => {
  res.json({ 
    status: "Success",
    message: "Ab Paanchon (5) APIs online hain!",
    links: {
        junaid: "/junaid?type=sms",
        pjunaid: "/pjunaid?type=sms",
        njunaid: "/njunaid?type=sms",
        timejunaid: "/timejunaid?type=sms",
        pujunaid: "/pujunaid?type=sms"
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

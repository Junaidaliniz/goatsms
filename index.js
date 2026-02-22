const express = require("express");
const app = express();
const junaidRouter = require("./api/Junaid.js");

const PORT = process.env.PORT || 3000;

// Routes
app.use("/api", junaidRouter);

// Default Route
app.get("/", (req, res) => {
  res.send("Server is running! Use /api?type=numbers or /api?type=sms");
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});


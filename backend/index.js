const bodyparser = require("body-parser");
const express = require("express");
require("dotenv").config(); // Load env vars immediately
const app = express();
const cors = require("cors");
const { connect } = require("./db");
const router = require("./Routes/index");

console.log("DEBUG: TWOFACTOR_KEY is:", process.env.TWOFACTOR_KEY ? "Set" : "NOT SET");
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyparser.json({ limit: "50mb" }));
app.use(bodyparser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Server is running ✅");
});
app.use("/api", router);

// Start server immediately for Railway healthcheck
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Connect to DB in background
connect().then(() => {
  console.log("Database connected successfully");
}).catch((err) => {
  console.error("Database connection failed:", err);
});

app.use((req, res, next) => {
  req.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

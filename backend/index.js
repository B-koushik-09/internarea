const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const { connect } = require("./db");
const router = require("./Routes/index");

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Healthcheck route
app.get("/", (req, res) => {
  res.status(200).send("Server is running ✅");
});

// API routes
app.use("/api", router);

// Connect to DB (cached for serverless)
connect()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("Database error:", err));

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;

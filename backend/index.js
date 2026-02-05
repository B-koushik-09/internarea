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

// Healthcheck route for Railway
app.get("/", (req, res) => {
  res.status(200).send("Server is running ✅");
});

// API routes
app.use("/api", router);

// Start server only after DB is connected
connect()
  .then(() => {
    console.log("Database connected successfully");

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

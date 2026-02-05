const express = require("express");
const router = express.Router();
const connect = require("../db");
const User = require("../Model/User");

// Get User by ID
router.get("/:id", async (req, res) => {
    try {
        await connect();
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get User by Email
router.get("/by-email/:email", async (req, res) => {
    try {
        await connect();
        const user = await User.findOne({ email: req.params.email.toLowerCase() });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

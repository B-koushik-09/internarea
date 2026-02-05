const express = require("express");
const router = express.Router();
const Message = require("../Model/Message");
const connect = require("../db");

router.post("/send", async (req, res) => {
    try {
        await connect();
        const { sender, receiver, content, sharedPost } = req.body;
        if (!sender || !receiver) return res.status(400).json({ error: "Missing sender or receiver" });

        const newMessage = await Message.create({
            sender,
            receiver,
            content,
            sharedPost,
            type: sharedPost ? "post" : "text"
        });
        const populated = await newMessage.populate("sharedPost");
        res.json(populated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get("/conversation/:user1/:user2", async (req, res) => {
    try {
        await connect();
        const { user1, user2 } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: user1, receiver: user2 },
                { sender: user2, receiver: user1 }
            ]
        })
            .populate("sharedPost")
            .populate("sender", "name photo")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get("/inbox/:userId", async (req, res) => {
    try {
        await connect();
        const msgs = await Message.find({ receiver: req.params.userId })
            .populate("sender", "name photo")
            .populate("sharedPost")
            .sort({ createdAt: -1 });
        res.json(msgs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Resume = require("../Model/Resume");
const User = require("../Model/User");
 
router.post("/create", async (req, res) => {
    try {
        const { userId, details, paymentId } = req.body; 
        if (!paymentId) return res.status(400).json({ error: "Payment required" });
        const newResume = await Resume.create({
            user: userId,
            details,
            paymentId
        });
        await User.findByIdAndUpdate(userId, {
            resumeAccess: true,
            $push: { resumes: newResume._id }
        });

        res.json({ message: "Resume generated and saved", resume: newResume });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/my/:userId", async (req, res) => {
    const resumes = await Resume.find({ user: req.params.userId });
    res.json(resumes);
});

module.exports = router;

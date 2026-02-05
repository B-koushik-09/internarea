const express = require("express");
const router = express.Router();
const connect = require("../db");
const application = require("../Model/Application");
const User = require("../Model/User");

// ✅ CREATE APPLICATION WITH SUBSCRIPTION LIMIT CHECK
router.post("/", async (req, res) => {
  try {
    await connect();
    const userId = req.body.user?._id;

    // Check subscription limit before creating application
    if (userId) {
      const user = await User.findById(userId);
      const plan = user?.subscription?.plan || "Free";
      const limits = { Free: 1, Bronze: 3, Silver: 5, Gold: Infinity };
      const limit = limits[plan] || 1;

      // Count applications this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyCount = await application.countDocuments({
        "user._id": userId,
        createdAt: { $gte: startOfMonth }
      });

      if (limit !== Infinity && monthlyCount >= limit) {
        return res.status(403).json({
          error: `Monthly application limit reached (${monthlyCount}/${limit}). Please upgrade your subscription plan.`,
          limitReached: true,
          used: monthlyCount,
          limit: limit,
          plan: plan
        });
      }
    }

    // Create the application
    const applicationipdata = new application({
      company: req.body.company,
      category: req.body.category,
      coverLetter: req.body.coverLetter,
      user: req.body.user,
      Application: req.body.Application,
      body: req.body.body,
    });

    const savedData = await applicationipdata.save();
    res.status(201).json(savedData);

  } catch (error) {
    console.error("[application] Error:", error);
    res.status(500).json({ error: "Failed to submit application" });
  }
});
router.get("/", async (req, res) => {
  try {
    await connect();
    const data = await application.find();
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "internal server error" });
  }
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await connect();
    const data = await application.findById(id);
    if (!data) {
      res.status(404).json({ error: "application not found" });
    }
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "internal server error" });
  }
});
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  let status;
  if (action === "accepted") {
    status = "accepted";
  } else if (action === "rejected") {
    status = "rejected";
  } else {
    res.status(404).json({ error: "Invalid action" });
    return;
  }
  try {
    await connect();
    const updateapplication = await application.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!updateapplication) {
      res.status(404).json({ error: "Not able to update the application" });
      return;
    }
    res.status(200).json({ sucess: true, data: updateapplication });
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
  }
});
module.exports = router;

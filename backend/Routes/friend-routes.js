const express = require("express");
const router = express.Router();
const FriendRequest = require("../Model/FriendRequest");
const User = require("../Model/User");

router.post("/send", async (req, res) => {
  const { from, to } = req.body;
  const already = await FriendRequest.findOne({ "from": from, "to": to });
  if (already) return res.json({ msg: "Request already sent" });

  await FriendRequest.create({ from, to });
  res.json({ msg: "Friend request sent" });
});

router.post("/accept", async (req, res) => {
  const { requestId } = req.body;

  const request = await FriendRequest.findById(requestId);
  if (!request) return res.json({ msg: "Request not found" });

  request.status = "accepted";
  await request.save();

  await User.findByIdAndUpdate(request.from, {
    $addToSet: { friends: request.to }
  });

  await User.findByIdAndUpdate(request.to, {
    $addToSet: { friends: request.from }
  });

  res.json({ msg: "Friend added successfully" });
});

router.get("/requests/:userId", async (req, res) => {
  const data = await FriendRequest.find({
    to: req.params.userId,
    status: "pending"
  }).populate("from", "name email");

  res.json(data);
});

router.get("/list/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId).populate("friends", "name email");
  res.json(user.friends);
});
router.get("/search/:query", async (req, res) => {
  try {
    const query = req.params.query;
    const users = await User.find({
      name: { $regex: query, $options: "i" },
    }).limit(10).select("_id name email photo");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



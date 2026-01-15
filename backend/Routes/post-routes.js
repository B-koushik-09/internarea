const express = require("express");
const router = express.Router();
const Post = require("../Model/Post");
const User = require("../Model/User");
 
const checkLimit = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return { allowed: false, limit: 0, count: 0 };

  const friendCount = Array.isArray(user.friends) ? user.friends.length : 0;
  let limit = 0;
  if (friendCount > 10) limit = Infinity;
  else limit = friendCount;
  console.log(`[Limit Check] User: ${user.name}, Friends: ${friendCount}, Limit: ${limit}`);
  if (limit === 0) return { allowed: false, limit, count: friendCount };
  if (limit === Infinity) return { allowed: true, limit, count: friendCount };
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const postsToday = await Post.countDocuments({
    user: userId,
    createdAt: { $gte: startOfDay }
  });

  console.log(`[Limit Check] Posts Today: ${postsToday}`);

  return { allowed: postsToday < limit, limit, count: friendCount };
};
 
router.post("/create", async (req, res) => {
  const { userId, content, mediaUrl } = req.body;

  const { allowed, limit, count } = await checkLimit(userId);

  if (!allowed) {
    const limitDisplay = limit === Infinity ? "Unlimited" : limit;
    return res.json({ msg: `Daily post limit reached. Your limit is ${limitDisplay} posts (Friends: ${count})` });
  }

  await Post.create({ user: userId, content, mediaUrl });
  res.json({ msg: "Post created successfully!" });
});
 
router.get("/feed/:userId", async (req, res) => {
  const posts = await Post.find()
    .populate("user", "name photo")
    .populate("comments.user", "name photo")
    .sort({ createdAt: -1 });

  res.json(posts);
});

router.post("/like", async (req, res) => {
  const { postId, userId } = req.body;

  const post = await Post.findById(postId);
  if (!post) return res.json({ msg: "Post not found" });

  if (post.likes.includes(userId)) {
    post.likes.pull(userId);
  } else {
    post.likes.push(userId);
  }

  await post.save();
  res.json({ msg: "Like updated" });
});

router.post("/comment", async (req, res) => {
  const { postId, userId, text } = req.body;

  await Post.findByIdAndUpdate(postId, {
    $push: { comments: { user: userId, text } }
  });

  res.json({ msg: "Comment added" });
});

router.post("/share", async (req, res) => {
  const { postId, userId } = req.body;

  const original = await Post.findById(postId);
  if (!original) return res.json({ msg: "Post not found" });

  await Post.create({
    user: userId,
    text: original.text,
    media: original.media
  });

  res.json({ msg: "Post shared" });
});

router.get("/my/:userId", async (req, res) => {
  const posts = await Post.find({ user: req.params.userId });
  res.json(posts);
});
 
router.delete("/delete/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ msg: "Post deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

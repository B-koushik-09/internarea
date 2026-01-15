const Post = require("../model/Post");
const User = require("../model/User");

module.exports = async function checkPostLimit(userId) {
  const user = await User.findById(userId);
  const friendCount = user.friends.length;

  let limit = 0;
  if (friendCount === 1) limit = 1;
  else if (friendCount === 2) limit = 2;
  else if (friendCount > 10) limit = 999; // unlimited
  else if (friendCount > 2) limit = friendCount;

  const today = new Date();
  today.setHours(0,0,0,0);

  const postCount = await Post.countDocuments({
    user: userId,
    createdAt: { $gte: today }
  });

  return postCount < limit;
};

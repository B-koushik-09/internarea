const express = require("express");
const router = express.Router();
const admin = require("./admin");
const intern = require("./internship");
const job = require("./job");
const application = require("./application")
const friend = require("./friend-routes");
const Post = require("./post-routes");
const User = require("./user-routes"); // FIXED: Pointing to route file
const Auth = require("./auth");
const Subscription = require("./subscription");
const Resume = require("./resume");

router.use("/admin", admin);
router.use("/internship", intern);
router.use("/job", job);
router.use("/application", application);
router.use("/friend-routes", friend);
router.use("/post-routes", Post);
router.use("/user-routes", User);
router.use("/auth", Auth);
router.use("/subscription", Subscription);
router.use("/resume", Resume);
router.use("/message", require("./message-routes"));

module.exports = router;

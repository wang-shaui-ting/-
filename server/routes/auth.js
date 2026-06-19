const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");

// 微信登录
router.post("/login", ctrl.login);

// 获取用户信息（需登录）
router.get("/profile", authMiddleware, ctrl.getProfile);

// 更新用户信息（需登录）
router.put("/profile", authMiddleware, ctrl.updateProfile);

module.exports = router;

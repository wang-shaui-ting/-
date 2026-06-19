const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/wantedController");
const { authMiddleware } = require("../middleware/auth");

// 公开
router.get("/", ctrl.list);

// 需登录
router.post("/", authMiddleware, ctrl.create);
router.post("/:id/like", authMiddleware, ctrl.like);
router.put("/:id/close", authMiddleware, ctrl.close);

module.exports = router;

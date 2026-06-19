const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/goodsController");
const { authMiddleware } = require("../middleware/auth");

// 公开接口
router.get("/", ctrl.list);
router.get("/:id", ctrl.detail);

// 需登录
router.post("/", authMiddleware, ctrl.create);
router.put("/:id", authMiddleware, ctrl.update);
router.delete("/:id", authMiddleware, ctrl.remove);
router.get("/my/list", authMiddleware, ctrl.myGoods);

module.exports = router;

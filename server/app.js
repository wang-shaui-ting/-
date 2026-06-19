const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const authRoutes = require("./routes/auth");
const goodsRoutes = require("./routes/goods");
const wantedRoutes = require("./routes/wanted");

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 图片上传
const storage = multer.diskStorage({
  destination: path.join(__dirname, "uploads"),
  filename(req, file, cb) {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname),
    );
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, msg: "请选择文件" });
  const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ code: 200, data: { url } });
});

// 路由
app.use("/api/auth", authRoutes);
app.use("/api/goods", goodsRoutes);
app.use("/api/wanted", wantedRoutes);

// 健康检查
app.get("/", (req, res) =>
  res.json({ code: 200, msg: "校园二手交易 API running" }),
);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

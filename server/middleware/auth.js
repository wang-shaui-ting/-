const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "campus_trade_secret_key_2024";

/** 生成 JWT */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/** JWT 鉴权中间件 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ code: 401, msg: "未登录" });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.openid = decoded.openid;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, msg: "token 已过期，请重新登录" });
  }
}

module.exports = { generateToken, authMiddleware };

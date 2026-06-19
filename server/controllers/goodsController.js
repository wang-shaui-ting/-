const db = require("../config/db");

/** 商品列表（分页 + 分类筛选） */
exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const category = parseInt(req.query.category) || 0;
    const offset = (page - 1) * pageSize;

    let sql =
      "SELECT g.id, g.title, g.category, g.price, g.images, g.status, g.created_at, u.nickname AS seller_name, u.avatar AS seller_avatar FROM goods g JOIN users u ON g.user_id = u.id WHERE g.status = 'selling'";
    const params = [];

    if (category > 0) {
      sql += " AND g.category = ?";
      params.push(category);
    }
    sql += " ORDER BY g.created_at DESC LIMIT ? OFFSET ?";
    params.push(pageSize, offset);

    const [rows] = await db.query(sql, params);

    // 总数
    let countSql =
      "SELECT COUNT(*) AS total FROM goods WHERE status = 'selling'";
    const countParams = [];
    if (category > 0) {
      countSql += " AND category = ?";
      countParams.push(category);
    }
    const [[{ total }]] = await db.query(countSql, countParams);

    // 解析 images JSON
    const list = rows.map((item) => ({
      ...item,
      images:
        typeof item.images === "string"
          ? JSON.parse(item.images)
          : item.images || [],
    }));

    res.json({ code: 200, data: { list, total, page, pageSize } });
  } catch (err) {
    console.error("goods list error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};

/** 商品详情 */
exports.detail = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT g.*, u.nickname AS seller_name, u.avatar AS seller_avatar, u.campus AS seller_campus FROM goods g JOIN users u ON g.user_id = u.id WHERE g.id = ?",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ code: 404, msg: "商品不存在" });

    const goods = rows[0];
    goods.images =
      typeof goods.images === "string"
        ? JSON.parse(goods.images)
        : goods.images || [];

    res.json({ code: 200, data: goods });
  } catch (err) {
    console.error("goods detail error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};

/** 发布商品 */
exports.create = async (req, res) => {
  try {
    const { title, category, price, description, images } = req.body;
    if (!title || !price)
      return res.status(400).json({ code: 400, msg: "标题和价格必填" });

    const [result] = await db.query(
      "INSERT INTO goods (user_id, title, category, price, description, images) VALUES (?, ?, ?, ?, ?, ?)",
      [
        req.userId,
        title,
        category || 0,
        price,
        description || "",
        JSON.stringify(images || []),
      ],
    );

    res.json({ code: 200, data: { id: result.insertId }, msg: "发布成功" });
  } catch (err) {
    console.error("goods create error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};

/** 修改商品（仅本人） */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, price, description, images, status } = req.body;

    // 校验所有权
    const [rows] = await db.query("SELECT user_id FROM goods WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ code: 404, msg: "商品不存在" });
    if (rows[0].user_id !== req.userId)
      return res.status(403).json({ code: 403, msg: "无权操作" });

    const fields = [];
    const values = [];
    if (title !== undefined) {
      fields.push("title = ?");
      values.push(title);
    }
    if (category !== undefined) {
      fields.push("category = ?");
      values.push(category);
    }
    if (price !== undefined) {
      fields.push("price = ?");
      values.push(price);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }
    if (images !== undefined) {
      fields.push("images = ?");
      values.push(JSON.stringify(images));
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }

    if (fields.length === 0)
      return res.status(400).json({ code: 400, msg: "无更新字段" });

    values.push(id);
    await db.query(
      `UPDATE goods SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    res.json({ code: 200, msg: "更新成功" });
  } catch (err) {
    console.error("goods update error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};

/** 删除商品（仅本人） */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT user_id FROM goods WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ code: 404, msg: "商品不存在" });
    if (rows[0].user_id !== req.userId)
      return res.status(403).json({ code: 403, msg: "无权操作" });

    await db.query("DELETE FROM goods WHERE id = ?", [id]);
    res.json({ code: 200, msg: "删除成功" });
  } catch (err) {
    console.error("goods remove error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};

/** 我的发布 */
exports.myGoods = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, title, category, price, images, status, created_at FROM goods WHERE user_id = ? ORDER BY created_at DESC",
      [req.userId],
    );
    const list = rows.map((item) => ({
      ...item,
      images:
        typeof item.images === "string"
          ? JSON.parse(item.images)
          : item.images || [],
    }));
    res.json({ code: 200, data: list });
  } catch (err) {
    console.error("myGoods error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};

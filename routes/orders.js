const router = require("express").Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

router.post("/", auth, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    let total = 0;
    const finalItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: "A product no longer exists." });

      const quantity = Math.max(1, Number(item.quantity) || 1);
      if (product.stock < quantity) {
        return res.status(400).json({ message: `${product.name} has only ${product.stock} item(s) left.` });
      }

      total += product.price * quantity;
      finalItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image
      });
    }

    for (const item of finalItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    const order = await Order.create({
      user: req.user.id,
      items: finalItems,
      total,
      shippingAddress
    });

    res.status(201).json({
      message: "Order placed successfully.",
      order
    });
  } catch (err) {
    res.status(500).json({ message: "Order processing failed.", error: err.message });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Could not load orders.", error: err.message });
  }
});

module.exports = router;

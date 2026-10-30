
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your username and password.",
      });
    }

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    let admin = await Admin.findOne({ username });

    if (!admin) {
      const hashedPassword = await bcrypt.hash(password, 12);

      admin = await Admin.create({
        username,
        password: hashedPassword,
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured.",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id.toString(),
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      success: true,
      message: "Admin login successful.",
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not log in.",
    });
  }
});

module.exports = router;

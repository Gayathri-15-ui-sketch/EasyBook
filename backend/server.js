
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const Appointment = require("./models/appointment");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Admin login routes
app.use("/api/admin", adminRoutes);

// Home route
app.get("/", (req, res) => {
  res.send("EasyBook backend is running successfully!");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "EasyBook API is working!",
  });
});

// Verify admin login token
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Admin login required.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login. Please log in again.",
    });
  }
}

// Book a new appointment
app.post("/api/appointments", async (req, res) => {
  try {
    const {
      customerName,
      email,
      service,
      appointmentDate,
      appointmentTime,
    } = req.body;

    if (
      !customerName ||
      !email ||
      !service ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all appointment details.",
      });
    }

    const appointment = new Appointment({
      customerName,
      email,
      service,
      appointmentDate,
      appointmentTime,
    });

    const savedAppointment = await appointment.save();

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully!",
      appointment: savedAppointment,
    });
  } catch (error) {
    console.error("Booking error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not book appointment.",
    });
  }
});

// View all appointments (admin only)
app.get("/api/appointments", requireAdmin, async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Fetch appointments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve appointments.",
    });
  }
});

// Check required environment variables
if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in backend/.env");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in backend/.env");
  process.exit(1);
}

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(
        `EasyBook backend running at http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

const express = require("express");
const router = express.Router();

const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking
} = require("../controllers/users/booking.controller");

// CREATE
router.post("/create", createBooking);

// READ
router.get("/all_bookings", getAllBookings);
router.get("/booking/:id", getBookingById);

// UPDATE
router.put("/update/:id", updateBooking);

// DELETE
router.delete("/deletebooking/:id", deleteBooking);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingsByCustomer,
  updateBooking,
  deleteBooking,
  cancelBooking,
  downloadBookingPDF,
  emailBookingReport
} = require("../controllers/users/booking.controller");

// CREATE
router.post("/create", createBooking);

// READ
router.get("/all_bookings", getAllBookings);
router.get("/booking/:id", getBookingById);
router.get("/customer/:customer_id", getBookingsByCustomer);

// UPDATE
router.put("/update/:id", updateBooking);

// CANCEL
router.put("/cancel/:id", cancelBooking);

// DELETE
router.delete("/deletebooking/:id", deleteBooking);

// PDF & EMAIL
router.get("/pdf/:id", downloadBookingPDF);
router.post("/email/:id", emailBookingReport);

module.exports = router;

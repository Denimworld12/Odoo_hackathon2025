const { Router } = require("express");
const {
  reserveSlot,
  releaseReservation,
  confirmReservation,
  getAvailableSlots,
  getActiveReservation,
  extendReservation
} = require("../controllers/reservation.controller");

const router = Router();

// Reserve a slot (5-minute hold)
router.post("/reserve", reserveSlot);

// Get available slots for a date
router.get("/available/:appointment_type_id/:date", getAvailableSlots);

// Get user's active reservation
router.get("/active/:customer_id", getActiveReservation);

// Release a reservation (cancel before confirming)
router.delete("/:id", releaseReservation);

// Confirm reservation (convert to booking)
router.post("/:id/confirm", confirmReservation);

// Extend reservation time
router.put("/:id/extend", extendReservation);

module.exports = { reservationRouter: router };

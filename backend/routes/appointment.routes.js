const { Router } = require("express");
const {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment
} = require("../controllers/appointment.controller");
const router = Router();

/**
 * GET /api/appointments/all-appointments
 */
router.get("/all-appointments", getAllAppointments);





/**
 * CREATE
 */
router.post("/create-appointment", createAppointment);

/**
 * UPDATE
 */
router.put("/update/:id", updateAppointment);

/**
 * DELETE
 */
router.delete("/:id", deleteAppointment);

module.exports = { appointmentRouter: router };
const { Router } = require("express");
const { getAllAppointments } = require("../controllers/appointment.controller.js");

const router = Router();

/**
 * GET /api/appointments/all-appointments
 */
router.get("/all-appointments", getAllAppointments);

module.exports = { appointmentRouter: router };
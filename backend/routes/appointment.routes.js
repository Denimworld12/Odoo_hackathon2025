const { Router } = require("express");
const { getAllAppointments } = require("../controllers/users/appointment.controller.js");
const { createService, updateService, deleteService } = require("../controllers/post/appointments.controller.js");

const router = Router();

router.get("/all-appointments", getAllAppointments);

router.post("/services", createService);

router.put("/services/:id", updateService);

router.delete("/services/:id", deleteService);

module.exports = { appointmentRouter: router };

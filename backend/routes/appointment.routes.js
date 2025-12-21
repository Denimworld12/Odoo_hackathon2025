const { Router } = require("express");
const { getAllAppointments, getAppointmentsByOrganiser } = require("../controllers/appointment.controller.js");
const { createService, updateService, deleteService } = require("../controllers/post/appointments.controller.js");

const router = Router();

router.get("/all-appointments", getAllAppointments);

router.get("/organiser/:organiser_id", getAppointmentsByOrganiser);

router.post("/services", createService);

router.put("/services/:id", updateService);

router.delete("/services/:id", deleteService);

module.exports = { appointmentRouter: router };

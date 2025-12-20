const { Router } = require("express");
<<<<<<< HEAD
const { getAllAppointments } = require("../controllers/users/appointment.controller.js");
const { createService, updateService, deleteService } = require("../controllers/post/appointments.controller.js");

=======
const {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment
} = require("../controllers/appointment.controller");
>>>>>>> ddd86cfecc32b456310dfedffb4312ad2a35fbc4
const router = Router();

router.get("/all-appointments", getAllAppointments);

<<<<<<< HEAD
router.post("/services", createService);

router.put("/services/:id", updateService);

router.delete("/services/:id", deleteService);

module.exports = { appointmentRouter: router };
=======




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
>>>>>>> ddd86cfecc32b456310dfedffb4312ad2a35fbc4

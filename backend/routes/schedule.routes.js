const express = require("express");
const router = express.Router();
const {
  createSchedule,
  getSchedulesByAppointmentType,
  updateSchedule,
  deleteSchedule
} = require("../controllers/schedule.controller");

// CREATE - Save schedules for an appointment type
router.post("/", createSchedule);

// READ - Get schedules by appointment type
router.get("/:appointment_type_id", getSchedulesByAppointmentType);

// UPDATE - Update a specific schedule
router.put("/:id", updateSchedule);

// DELETE - Delete a specific schedule
router.delete("/:id", deleteSchedule);

module.exports = router;

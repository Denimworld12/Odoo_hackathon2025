const express = require("express");
const router = express.Router();
const {
  createQuestions,
  getQuestionsByAppointmentType,
  updateQuestion,
  deleteQuestion
} = require("../controllers/question.controller");

// CREATE - Save questions for an appointment type
router.post("/", createQuestions);

// READ - Get questions by appointment type
router.get("/:appointment_type_id", getQuestionsByAppointmentType);

// UPDATE - Update a specific question
router.put("/:id", updateQuestion);

// DELETE - Delete a specific question
router.delete("/:id", deleteQuestion);

module.exports = router;

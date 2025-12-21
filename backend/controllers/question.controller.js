const { pool } = require("../config/db.js");

/**
 * CREATE CUSTOM QUESTIONS FOR APPOINTMENT TYPE
 * POST /api/questions
 */
const createQuestions = async (req, res) => {
  const { appointment_type_id, questions } = req.body;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Delete existing questions for this appointment type
    await client.query(
      `DELETE FROM custom_questions WHERE appointment_type_id = $1`,
      [appointment_type_id]
    );

    // Insert new questions into custom_questions table
    const insertedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      // field_type uses question_type enum, cast explicitly
      const result = await client.query(
        `INSERT INTO custom_questions (appointment_type_id, label, field_type, is_mandatory, sort_order)
         VALUES ($1, $2, $3::question_type, $4, $5)
         RETURNING *`,
        [appointment_type_id, q.label, q.field_type || 'TEXT', q.is_mandatory || false, i]
      );
      insertedQuestions.push(result.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Questions created successfully",
      questions: insertedQuestions
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Create questions error:", err);
    res.status(500).json({ success: false, message: "Failed to create questions", error: err.message });
  } finally {
    client.release();
  }
};

/**
 * GET QUESTIONS BY APPOINTMENT TYPE ID
 * GET /api/questions/:appointment_type_id
 */
const getQuestionsByAppointmentType = async (req, res) => {
  const { appointment_type_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM custom_questions WHERE appointment_type_id = $1 ORDER BY sort_order`,
      [appointment_type_id]
    );

    res.json({
      success: true,
      questions: result.rows
    });
  } catch (err) {
    console.error("Get questions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch questions" });
  }
};

/**
 * UPDATE QUESTION
 * PUT /api/questions/:id
 */
const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { label, field_type, is_mandatory, sort_order } = req.body;

  try {
    // field_type uses question_type enum, cast explicitly
    const result = await pool.query(
      `UPDATE custom_questions
       SET label = COALESCE($1, label),
           field_type = COALESCE($2::question_type, field_type),
           is_mandatory = COALESCE($3, is_mandatory),
           sort_order = COALESCE($4, sort_order)
       WHERE id = $5
       RETURNING *`,
      [label, field_type, is_mandatory, sort_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    res.json({
      success: true,
      question: result.rows[0]
    });
  } catch (err) {
    console.error("Update question error:", err);
    res.status(500).json({ success: false, message: "Failed to update question" });
  }
};

/**
 * DELETE QUESTION
 * DELETE /api/questions/:id
 */
const deleteQuestion = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM custom_questions WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    res.json({
      success: true,
      message: "Question deleted successfully"
    });
  } catch (err) {
    console.error("Delete question error:", err);
    res.status(500).json({ success: false, message: "Failed to delete question" });
  }
};

module.exports = {
  createQuestions,
  getQuestionsByAppointmentType,
  updateQuestion,
  deleteQuestion
};

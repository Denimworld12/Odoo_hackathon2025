// controllers/serviceController.js
const { pool } = require("../../config/db.js");

// 1. POST: Create a new appointment type with schedules and questions
const createService = async (req, res) => {
  const { 
    title, description, location, duration_minutes, 
    booking_fee, manual_confirmation, is_published, 
    target_type, assignment_type,
    schedules, // Array of { day_of_week, start_time, end_time }
    questions, // Array of { label, field_type, is_mandatory }
    resources  // Array of resource IDs to link
  } = req.body;
  const organiser_id = req.user_id || req.body.user_id; // From Auth Middleware or body

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create the appointment type
    const appointmentResult = await client.query(
      `INSERT INTO public.appointment_types 
      (organiser_id, title, description, location, duration_minutes, booking_fee, manual_confirmation, is_published, target_type, assignment_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [organiser_id, title, description || '', location || '', duration_minutes, booking_fee || 0, manual_confirmation || false, is_published || false, target_type || 'USER', assignment_type || 'AUTOMATIC']
    );
    
    const appointment = appointmentResult.rows[0];
    const appointment_type_id = appointment.id;

    // 2. Create schedules if provided
    const insertedSchedules = [];
    if (schedules && Array.isArray(schedules)) {
      for (const schedule of schedules) {
        const scheduleResult = await client.query(
          `INSERT INTO schedules (appointment_type_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [appointment_type_id, schedule.day_of_week, schedule.start_time, schedule.end_time]
        );
        insertedSchedules.push(scheduleResult.rows[0]);
      }
    }

    // 3. Create custom questions if provided
    const insertedQuestions = [];
    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionResult = await client.query(
          `INSERT INTO custom_questions (appointment_type_id, label, field_type, is_mandatory, sort_order)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [appointment_type_id, q.label, q.field_type || 'TEXT', q.is_mandatory || false, i]
        );
        insertedQuestions.push(questionResult.rows[0]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      ...appointment,
      schedules: insertedSchedules,
      questions: insertedQuestions
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Create service error:", err);
    console.error("Error details:", err.detail || err.hint || "No additional details");
    res.status(500).json({ success: false, message: "Failed to create service", error: err.message, detail: err.detail });
  } finally {
    client.release();
  }
};

// 2. PUT: Update existing service
const updateService = async (req, res) => {
  const { id } = req.params;
  const { 
    title, description, location, duration_minutes, 
    booking_fee, manual_confirmation, is_published 
  } = req.body;
  const organiser_id = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE public.appointment_types 
       SET title=$1, description=$2, location=$3, duration_minutes=$4, 
           booking_fee=$5, manual_confirmation=$6, is_published=$7
       WHERE id=$8 AND organiser_id=$9 
       RETURNING *`,
      [title, description, location, duration_minutes, booking_fee, manual_confirmation, is_published, id, organiser_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

// 3. DELETE: Remove service
const deleteService = async (req, res) => {
  const { id } = req.params;
  const organiser_id = req.user.id; 
  try {
    const result = await pool.query(
      "DELETE FROM public.appointment_types WHERE id=$1 AND organiser_id=$2", 
      [id, organiser_id]
    );

    // Use rowCount to check if anything was actually deleted
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        message: "Service not found or you don't have permission to delete it." 
      });
    }

    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

module.exports = { createService, updateService, deleteService };
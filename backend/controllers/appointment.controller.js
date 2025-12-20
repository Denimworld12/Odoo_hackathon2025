const { pool } = require("../config/db.js");

/**
 * GET ALL APPOINTMENT TYPES
 */
const getAllAppointments = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        organiser_id,
        title,
        description,
        location,
        duration_minutes,
        booking_fee,
        manual_confirmation,
        is_published,
        target_type,
        assignment_type
      FROM public.appointment_types
      `
    );

    res.json({
      count: result.rows.length,
      appointments: result.rows
    });
  } catch (err) {
    console.error("Get appointments error:", err);
    res.status(500).json({
      message: "Failed to fetch appointments"
    });
  }
};

/**
 * CREATE APPOINTMENT TYPE
 * POST /api/appointments
 */
const createAppointment = async (req, res) => {
  const {
    organiser_id,
    title,
    description,
    location,
    duration_minutes,
    booking_fee,
    manual_confirmation,
    is_published,
    target_type,
    assignment_type,
    profile_image
  } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO appointment_types (
        organiser_id,
        title,
        description,
        location,
        duration_minutes,
        booking_fee,
        manual_confirmation,
        is_published,
        target_type,
        assignment_type,
        profile_image
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        organiser_id,
        title,
        description,
        location,
        duration_minutes,
        booking_fee || 0,
        manual_confirmation || false,
        is_published || false,
        target_type || "USER",
        assignment_type || "AUTOMATIC",
        profile_image || "default.jpg"
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create appointment error:", err);
    res.status(500).json({ message: "Failed to create appointment" });
  }
};

/**
 * UPDATE APPOINTMENT TYPE
 * PUT /api/appointments/:id
 */
const updateAppointment = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    location,
    duration_minutes,
    booking_fee,
    manual_confirmation,
    is_published,
    target_type,
    assignment_type,
    profile_image
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE appointment_types
      SET
        title = $1,
        description = $2,
        location = $3,
        duration_minutes = $4,
        booking_fee = $5,
        manual_confirmation = $6,
        is_published = $7,
        target_type = $8,
        assignment_type = $9,
        profile_image = $10
      WHERE id = $11
      RETURNING *
      `,
      [
        title,
        description,
        location,
        duration_minutes,
        booking_fee,
        manual_confirmation,
        is_published,
        target_type,
        assignment_type,
        profile_image,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update appointment error:", err);
    res.status(500).json({ message: "Failed to update appointment" });
  }
};

/**
 * DELETE APPOINTMENT TYPE
 * DELETE /api/appointments/:id
 */
const deleteAppointment = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM appointment_types
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("Delete appointment error:", err);
    res.status(500).json({ message: "Failed to delete appointment" });
  }
};

module.exports = { getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment };

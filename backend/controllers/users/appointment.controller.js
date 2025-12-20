const { pool } = require("../../config/db.js");

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


const updateAppointmentsforUser = async (req, res) => {
  try {
    
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user appointments" });
  }
}

module.exports = { getAllAppointments };


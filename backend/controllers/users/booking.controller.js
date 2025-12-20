const { pool } = require("../../config/db.js");

/**
 * POST /api/bookings
 * Create a new booking based on the provided schema
 */
const createBooking = async (req, res) => {
  const { 
    appointment_type_id, 
    customer_id, 
    resource_id, 
    assigned_user_id, 
    start_time, 
    end_time 
  } = req.body;

  try {
    // 1. Transaction Start: Prevent double booking
    await pool.query('BEGIN');

    // Check if the Resource or User is already booked for this time range
    const conflictCheck = await pool.query(
      `SELECT id FROM public.bookings 
       WHERE (resource_id = $1 OR assigned_user_id = $2)
       AND status IN ('PENDING', 'CONFIRMED')
       AND (start_time, end_time) OVERLAPS ($3, $4)`,
      [resource_id, assigned_user_id, start_time, end_time]
    );

    if (conflictCheck.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(409).json({ message: "The resource or staff is already booked for this time." });
    }

    // 2. Insert into bookings table
    const result = await pool.query(
      `INSERT INTO public.bookings 
      (appointment_type_id, customer_id, resource_id, assigned_user_id, start_time, end_time, status, payment_status)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', 'UNPAID')
      RETURNING *`,
      [appointment_type_id, customer_id, resource_id, assigned_user_id, start_time, end_time]
    );

    await pool.query('COMMIT');

    res.status(201).json({
      message: "Booking created successfully",
      booking: result.rows[0]
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error("Booking error:", err);
    res.status(500).json({ message: "Failed to create booking" });
  }
};

module.exports = { createBooking };
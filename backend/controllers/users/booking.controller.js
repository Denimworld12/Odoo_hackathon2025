const { pool } = require("../../config/db");

/**
 * CREATE BOOKING
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
    const result = await pool.query(
      `
      INSERT INTO bookings (
        appointment_type_id,
        customer_id,
        resource_id,
        assigned_user_id,
        start_time,
        end_time
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        appointment_type_id,
        customer_id,
        resource_id,
        assigned_user_id,
        start_time,
        end_time
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ message: "Failed to create booking" });
  }
};

/**
 * GET ALL BOOKINGS
 */
const getAllBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM bookings ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

/**
 * GET BOOKING BY ID
 */
const getBookingById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM bookings WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get booking error:", err);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
};

/**
 * UPDATE BOOKING
 */
const updateBooking = async (req, res) => {
  const { id } = req.params;
  const { status, payment_status, assigned_user_id } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE bookings
      SET
        status = COALESCE($1, status),
        payment_status = COALESCE($2, payment_status),
        assigned_user_id = COALESCE($3, assigned_user_id)
      WHERE id = $4
      RETURNING *
      `,
      [status, payment_status, assigned_user_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update booking error:", err);
    res.status(500).json({ message: "Failed to update booking" });
  }
};

/**
 * DELETE BOOKING
 */
const deleteBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM bookings WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Delete booking error:", err);
    res.status(500).json({ message: "Failed to delete booking" });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking
};

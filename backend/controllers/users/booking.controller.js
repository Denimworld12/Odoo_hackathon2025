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
    const { organiser_id } = req.query;
    
    let query = `
      SELECT 
        b.id,
        b.appointment_type_id,
        b.customer_id,
        b.resource_id,
        b.assigned_user_id,
        b.start_time,
        b.end_time,
        b.status,
        b.payment_status,
        b.created_at,
        b.payment_id,
        at.title AS service_name,
        at.location,
        at.duration_minutes,
        at.booking_fee,
        u.full_name AS customer_name,
        u2.full_name AS provider_name
      FROM bookings b
      LEFT JOIN appointment_types at ON b.appointment_type_id = at.id
      LEFT JOIN users u ON b.customer_id = u.id
      LEFT JOIN users u2 ON b.assigned_user_id = u2.id
      ORDER BY b.created_at DESC
    `;
    
    const result = await pool.query(query);
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
 * GET BOOKINGS BY CUSTOMER ID
 * GET /api/bookings/customer/:customer_id
 */
const getBookingsByCustomer = async (req, res) => {
  const { customer_id } = req.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!customer_id || !uuidRegex.test(customer_id)) {
    return res.status(400).json({ success: false, message: "Invalid customer ID format" });
  }

  try {
    const result = await pool.query(
  `
  SELECT 
    b.id,
    b.appointment_type_id,
    b.customer_id,
    b.resource_id,
    b.assigned_user_id,
    b.start_time,
    b.end_time,
    b.status,
    b.payment_status,
    b.created_at,
    b.payment_id,
    at.title AS service_name,
    at.location,
    at.duration_minutes,
    at.booking_fee,
    u.full_name AS provider_name
  FROM bookings b
  LEFT JOIN appointment_types at ON b.appointment_type_id = at.id
  LEFT JOIN users u ON b.assigned_user_id = u.id
  WHERE b.customer_id = $1
  ORDER BY b.created_at DESC
  `,
  [customer_id]
);


    res.json({
      success: true,
      count: result.rows.length,
      bookings: result.rows
    });
  } catch (err) {
    console.error("Get bookings by customer error:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Failed to fetch bookings", error: err.message });
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

/**
 * CANCEL BOOKING
 * PUT /api/bookings/cancel/:id
 * Sets booking status to CANCELLED
 */
const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const { customer_id } = req.body;

  try {
    // Verify the booking belongs to the customer
    const checkResult = await pool.query(
      `SELECT * FROM bookings WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = checkResult.rows[0];
    
    // Optional: verify customer owns this booking
    if (customer_id && booking.customer_id !== customer_id) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this booking" });
    }

    // Check if booking can be cancelled
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: "Cannot cancel a completed booking" });
    }

    // Cancel the booking
    const result = await pool.query(
      `UPDATE bookings SET status = 'CANCELLED' WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: result.rows[0]
    });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ success: false, message: "Failed to cancel booking" });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingsByCustomer,
  updateBooking,
  deleteBooking,
  cancelBooking
};

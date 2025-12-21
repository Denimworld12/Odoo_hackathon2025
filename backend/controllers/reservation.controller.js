const { pool } = require("../config/db");

const RESERVATION_TIMEOUT_MINUTES = 5;

/**
 * Clean up expired reservations
 */
const cleanupExpiredReservations = async () => {
  try {
    const result = await pool.query(
      `DELETE FROM slot_reservations WHERE expires_at < NOW() RETURNING *`
    );
    return result.rows;
  } catch (err) {
    console.error("Cleanup expired reservations error:", err);
    return [];
  }
};

/**
 * Get available capacity for a time slot
 * Capacity = resource.capacity - (active reservations + confirmed bookings)
 */
const getAvailableCapacity = async (appointmentTypeId, resourceId, startTime, endTime) => {
  // Get resource capacity
  const resourceResult = await pool.query(
    `SELECT capacity FROM resources WHERE id = $1 AND is_active = TRUE`,
    [resourceId]
  );
  
  if (resourceResult.rows.length === 0) {
    return 0;
  }
  
  const totalCapacity = resourceResult.rows[0].capacity;

  // Count active reservations (not expired) for this slot
  const reservationsResult = await pool.query(
    `SELECT COUNT(*) as count FROM slot_reservations 
     WHERE resource_id = $1 
     AND start_time = $2 
     AND end_time = $3
     AND expires_at > NOW()`,
    [resourceId, startTime, endTime]
  );
  
  const activeReservations = parseInt(reservationsResult.rows[0].count) || 0;

  // Count confirmed/pending bookings for this slot
  const bookingsResult = await pool.query(
    `SELECT COUNT(*) as count FROM bookings 
     WHERE resource_id = $1 
     AND start_time = $2 
     AND end_time = $3
     AND status IN ('PENDING', 'CONFIRMED')`,
    [resourceId, startTime, endTime]
  );
  
  const activeBookings = parseInt(bookingsResult.rows[0].count) || 0;

  return totalCapacity - activeReservations - activeBookings;
};

/**
 * RESERVE A SLOT
 * POST /api/reservations/reserve
 * Temporarily holds a slot for 5 minutes
 */
const reserveSlot = async (req, res) => {
  const { appointment_type_id, resource_id, start_time, end_time, customer_id } = req.body;

  // resource_id is optional - some appointment types don't have resources
  if (!appointment_type_id || !start_time || !end_time || !customer_id) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: appointment_type_id, start_time, end_time, customer_id"
    });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Clean up expired reservations first
    await client.query(`DELETE FROM slot_reservations WHERE expires_at < NOW()`);

    // Check if user already has an active reservation for this appointment type
    const existingUserReservation = await client.query(
      `SELECT id FROM slot_reservations 
       WHERE customer_id = $1 
       AND appointment_type_id = $2 
       AND expires_at > NOW()`,
      [customer_id, appointment_type_id]
    );

    if (existingUserReservation.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: "You already have an active reservation for this appointment type",
        existing_reservation_id: existingUserReservation.rows[0].id
      });
    }

    let totalCapacity = 1; // Default capacity if no resource

    // If resource_id is provided, get resource capacity
    if (resource_id) {
      const resourceResult = await client.query(
        `SELECT capacity FROM resources WHERE id = $1 AND is_active = TRUE`,
        [resource_id]
      );

      if (resourceResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: "Resource not found or inactive"
        });
      }

      totalCapacity = resourceResult.rows[0].capacity;
    }

    // Count active reservations for this slot
    const reservationsQuery = resource_id 
      ? `SELECT COUNT(*) as count FROM slot_reservations 
         WHERE resource_id = $1 AND start_time = $2 AND end_time = $3 AND expires_at > NOW()`
      : `SELECT COUNT(*) as count FROM slot_reservations 
         WHERE appointment_type_id = $1 AND resource_id IS NULL AND start_time = $2 AND end_time = $3 AND expires_at > NOW()`;
    
    const reservationsResult = await client.query(
      reservationsQuery,
      resource_id ? [resource_id, start_time, end_time] : [appointment_type_id, start_time, end_time]
    );

    const activeReservations = parseInt(reservationsResult.rows[0].count) || 0;

    // Count confirmed/pending bookings for this slot
    const bookingsQuery = resource_id
      ? `SELECT COUNT(*) as count FROM bookings 
         WHERE resource_id = $1 AND start_time = $2 AND end_time = $3 AND status IN ('PENDING', 'CONFIRMED')`
      : `SELECT COUNT(*) as count FROM bookings 
         WHERE appointment_type_id = $1 AND resource_id IS NULL AND start_time = $2 AND end_time = $3 AND status IN ('PENDING', 'CONFIRMED')`;
    
    const bookingsResult = await client.query(
      bookingsQuery,
      resource_id ? [resource_id, start_time, end_time] : [appointment_type_id, start_time, end_time]
    );

    const activeBookings = parseInt(bookingsResult.rows[0].count) || 0;
    const availableCapacity = totalCapacity - activeReservations - activeBookings;

    if (availableCapacity <= 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: "No capacity available for this time slot",
        available_capacity: 0
      });
    }

    // Create reservation with 5-minute expiry
    const expiresAt = new Date(Date.now() + RESERVATION_TIMEOUT_MINUTES * 60 * 1000);
    
    const reservationResult = await client.query(
      `INSERT INTO slot_reservations 
       (appointment_type_id, resource_id, customer_id, start_time, end_time, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [appointment_type_id, resource_id, customer_id, start_time, end_time, expiresAt]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Slot reserved successfully",
      reservation: reservationResult.rows[0],
      expires_at: expiresAt,
      timeout_minutes: RESERVATION_TIMEOUT_MINUTES,
      remaining_capacity: availableCapacity - 1
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Reserve slot error:", err);
    
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: "You already have a reservation for this slot"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to reserve slot"
    });
  } finally {
    client.release();
  }
};

/**
 * RELEASE A RESERVATION
 * DELETE /api/reservations/:id
 * Manually release a reservation (user cancels before confirming)
 */
const releaseReservation = async (req, res) => {
  const { id } = req.params;
  const customer_id = req.body.customer_id;

  try {
    const result = await pool.query(
      `DELETE FROM slot_reservations 
       WHERE id = $1 AND customer_id = $2
       RETURNING *`,
      [id, customer_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found or already released"
      });
    }

    res.json({
      success: true,
      message: "Reservation released successfully",
      released_reservation: result.rows[0]
    });

  } catch (err) {
    console.error("Release reservation error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to release reservation"
    });
  }
};

/**
 * CONFIRM RESERVATION (Convert to Booking)
 * POST /api/reservations/:id/confirm
 * Converts a reservation into an actual booking
 */
const confirmReservation = async (req, res) => {
  const { id } = req.params;
  const { customer_id, assigned_user_id, question_responses, payment_id } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get the reservation
    const reservationResult = await client.query(
      `SELECT * FROM slot_reservations 
       WHERE id = $1 AND customer_id = $2 AND expires_at > NOW()`,
      [id, customer_id]
    );

    if (reservationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: "Reservation not found, expired, or does not belong to you"
      });
    }

    const reservation = reservationResult.rows[0];

    // Determine payment status based on payment_id
    const paymentStatus = payment_id ? 'PAID' : 'UNPAID';
    const bookingStatus = payment_id ? 'CONFIRMED' : 'PENDING';

    // Create the booking with payment info
    const bookingResult = await client.query(
      `INSERT INTO bookings 
       (appointment_type_id, customer_id, resource_id, assigned_user_id, start_time, end_time, status, payment_status, payment_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        reservation.appointment_type_id,
        customer_id,
        reservation.resource_id,
        assigned_user_id || null,
        reservation.start_time,
        reservation.end_time,
        bookingStatus,
        paymentStatus,
        payment_id || null
      ]
    );

    const booking = bookingResult.rows[0];

    // Save question responses if provided
    if (question_responses && Array.isArray(question_responses)) {
      for (const response of question_responses) {
        await client.query(
          `INSERT INTO question_responses (booking_id, question_id, answer_value)
           VALUES ($1, $2, $3)`,
          [booking.id, response.question_id, response.answer_value]
        );
      }
    }

    // Delete the reservation (it's now a booking)
    await client.query(
      `DELETE FROM slot_reservations WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
      booking: booking
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Confirm reservation error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to confirm booking"
    });
  } finally {
    client.release();
  }
};

/**
 * GET AVAILABLE SLOTS
 * GET /api/reservations/available/:appointment_type_id/:date
 * Returns available time slots with remaining capacity
 */
const getAvailableSlots = async (req, res) => {
  const { appointment_type_id, date } = req.params;

  try {
    // Clean up expired reservations first
    await cleanupExpiredReservations();

    // Get appointment type details
    const appointmentResult = await pool.query(
      `SELECT at.*, r.id as resource_id, r.capacity, r.name as resource_name
       FROM appointment_types at
       LEFT JOIN resources r ON r.organiser_id = at.organiser_id AND r.is_active = TRUE
       WHERE at.id = $1`,
      [appointment_type_id]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment type not found"
      });
    }

    const appointment = appointmentResult.rows[0];
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Get schedules for this day
    const schedulesResult = await pool.query(
      `SELECT * FROM schedules 
       WHERE appointment_type_id = $1 AND day_of_week = $2
       ORDER BY start_time`,
      [appointment_type_id, dayOfWeek]
    );

    if (schedulesResult.rows.length === 0) {
      return res.json({
        success: true,
        message: "No schedules available for this day",
        slots: []
      });
    }

    const slots = [];
    const durationMinutes = appointment.duration_minutes;

    // Generate time slots based on schedules
    for (const schedule of schedulesResult.rows) {
      let currentTime = new Date(`${date}T${schedule.start_time}`);
      const endTime = new Date(`${date}T${schedule.end_time}`);

      while (currentTime < endTime) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);

        if (slotEnd <= endTime) {
          // Get available capacity for this slot
          const resourceId = appointment.resource_id;
          
          if (resourceId) {
            const availableCapacity = await getAvailableCapacity(
              appointment_type_id,
              resourceId,
              slotStart.toISOString(),
              slotEnd.toISOString()
            );

            slots.push({
              start_time: slotStart.toISOString(),
              end_time: slotEnd.toISOString(),
              available: availableCapacity > 0,
              remaining_capacity: availableCapacity,
              total_capacity: appointment.capacity || 1,
              resource_id: resourceId,
              resource_name: appointment.resource_name
            });
          } else {
            // No resource linked - check reservations/bookings for this appointment type directly
            const reservationsCount = await pool.query(
              `SELECT COUNT(*) as count FROM slot_reservations 
               WHERE appointment_type_id = $1 AND resource_id IS NULL 
               AND start_time = $2 AND end_time = $3 AND expires_at > NOW()`,
              [appointment_type_id, slotStart.toISOString(), slotEnd.toISOString()]
            );
            
            const bookingsCount = await pool.query(
              `SELECT COUNT(*) as count FROM bookings 
               WHERE appointment_type_id = $1 AND resource_id IS NULL 
               AND start_time = $2 AND end_time = $3 AND status IN ('PENDING', 'CONFIRMED')`,
              [appointment_type_id, slotStart.toISOString(), slotEnd.toISOString()]
            );
            
            const activeReservations = parseInt(reservationsCount.rows[0].count) || 0;
            const activeBookings = parseInt(bookingsCount.rows[0].count) || 0;
            const totalCapacity = 1; // Default capacity when no resource
            const availableCapacity = totalCapacity - activeReservations - activeBookings;
            
            slots.push({
              start_time: slotStart.toISOString(),
              end_time: slotEnd.toISOString(),
              available: availableCapacity > 0,
              remaining_capacity: Math.max(0, availableCapacity),
              total_capacity: totalCapacity,
              resource_id: null,
              resource_name: null
            });
          }
        }

        currentTime = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
      }
    }

    res.json({
      success: true,
      appointment_type: {
        id: appointment.id,
        title: appointment.title,
        duration_minutes: appointment.duration_minutes,
        booking_fee: appointment.booking_fee
      },
      date: date,
      slots: slots
    });

  } catch (err) {
    console.error("Get available slots error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available slots"
    });
  }
};

/**
 * GET USER'S ACTIVE RESERVATION
 * GET /api/reservations/active/:customer_id
 */
const getActiveReservation = async (req, res) => {
  const { customer_id } = req.params;

  try {
    // Clean up expired first
    await cleanupExpiredReservations();

    const result = await pool.query(
      `SELECT sr.*, at.title as appointment_title, r.name as resource_name
       FROM slot_reservations sr
       LEFT JOIN appointment_types at ON sr.appointment_type_id = at.id
       LEFT JOIN resources r ON sr.resource_id = r.id
       WHERE sr.customer_id = $1 AND sr.expires_at > NOW()
       ORDER BY sr.created_at DESC
       LIMIT 1`,
      [customer_id]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        has_active_reservation: false,
        reservation: null
      });
    }

    const reservation = result.rows[0];
    const now = new Date();
    const expiresAt = new Date(reservation.expires_at);
    const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

    res.json({
      success: true,
      has_active_reservation: true,
      reservation: reservation,
      remaining_seconds: remainingSeconds
    });

  } catch (err) {
    console.error("Get active reservation error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active reservation"
    });
  }
};

/**
 * EXTEND RESERVATION (Optional - if user needs more time)
 * PUT /api/reservations/:id/extend
 */
const extendReservation = async (req, res) => {
  const { id } = req.params;
  const { customer_id } = req.body;

  try {
    const newExpiresAt = new Date(Date.now() + RESERVATION_TIMEOUT_MINUTES * 60 * 1000);

    const result = await pool.query(
      `UPDATE slot_reservations 
       SET expires_at = $1
       WHERE id = $2 AND customer_id = $3 AND expires_at > NOW()
       RETURNING *`,
      [newExpiresAt, id, customer_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found or already expired"
      });
    }

    res.json({
      success: true,
      message: "Reservation extended successfully",
      reservation: result.rows[0],
      new_expires_at: newExpiresAt
    });

  } catch (err) {
    console.error("Extend reservation error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to extend reservation"
    });
  }
};

module.exports = {
  reserveSlot,
  releaseReservation,
  confirmReservation,
  getAvailableSlots,
  getActiveReservation,
  extendReservation,
  cleanupExpiredReservations
};

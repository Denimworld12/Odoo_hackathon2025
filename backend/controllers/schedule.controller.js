const { pool } = require("../config/db.js");

/**
 * CREATE SCHEDULE FOR APPOINTMENT TYPE
 * POST /api/schedules
 */
const createSchedule = async (req, res) => {
  const { appointment_type_id, schedules } = req.body;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Delete existing schedules for this appointment type
    await client.query(
      `DELETE FROM schedules WHERE appointment_type_id = $1`,
      [appointment_type_id]
    );

    // Insert new schedules
    const insertedSchedules = [];
    for (const schedule of schedules) {
      const result = await client.query(
        `INSERT INTO schedules (appointment_type_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [appointment_type_id, schedule.day_of_week, schedule.start_time, schedule.end_time]
      );
      insertedSchedules.push(result.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Schedules created successfully",
      schedules: insertedSchedules
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Create schedule error:", err);
    res.status(500).json({ success: false, message: "Failed to create schedules", error: err.message });
  } finally {
    client.release();
  }
};

/**
 * GET SCHEDULES BY APPOINTMENT TYPE ID
 * GET /api/schedules/:appointment_type_id
 */
const getSchedulesByAppointmentType = async (req, res) => {
  const { appointment_type_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM schedules WHERE appointment_type_id = $1 ORDER BY day_of_week, start_time`,
      [appointment_type_id]
    );

    res.json({
      success: true,
      schedules: result.rows
    });
  } catch (err) {
    console.error("Get schedules error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch schedules" });
  }
};

/**
 * UPDATE SCHEDULE
 * PUT /api/schedules/:id
 */
const updateSchedule = async (req, res) => {
  const { id } = req.params;
  const { day_of_week, start_time, end_time } = req.body;

  try {
    const result = await pool.query(
      `UPDATE schedules
       SET day_of_week = COALESCE($1, day_of_week),
           start_time = COALESCE($2, start_time),
           end_time = COALESCE($3, end_time)
       WHERE id = $4
       RETURNING *`,
      [day_of_week, start_time, end_time, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    res.json({
      success: true,
      schedule: result.rows[0]
    });
  } catch (err) {
    console.error("Update schedule error:", err);
    res.status(500).json({ success: false, message: "Failed to update schedule" });
  }
};

/**
 * DELETE SCHEDULE
 * DELETE /api/schedules/:id
 */
const deleteSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM schedules WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    res.json({
      success: true,
      message: "Schedule deleted successfully"
    });
  } catch (err) {
    console.error("Delete schedule error:", err);
    res.status(500).json({ success: false, message: "Failed to delete schedule" });
  }
};

module.exports = {
  createSchedule,
  getSchedulesByAppointmentType,
  updateSchedule,
  deleteSchedule
};

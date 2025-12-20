// controllers/serviceController.js
const { pool } = require("../../config/db.js");

// 1. POST: Create a new appointment type
const createService = async (req, res) => {
  const { 
    title, description, location, duration_minutes, 
    booking_fee, manual_confirmation, is_published, 
    target_type, assignment_type 
  } = req.body;
  const organiser_id = req.user.id; // From Auth Middleware

  try {
    const result = await pool.query(
      `INSERT INTO public.appointment_types 
      (organiser_id, title, description, location, duration_minutes, booking_fee, manual_confirmation, is_published, target_type, assignment_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [organiser_id, title, description, location, duration_minutes, booking_fee, manual_confirmation, is_published, target_type, assignment_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to create service", error: err.message });
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
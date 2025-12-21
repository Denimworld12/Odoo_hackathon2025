const { pool } = require("../config/db.js");

/**
 * CREATE RESOURCE
 * POST /api/resources
 */
const createResource = async (req, res) => {
  const { name, capacity, description, is_active } = req.body;
  const organiser_id = req.user_id; // From Auth Middleware

  try {
    const result = await pool.query(
      `INSERT INTO resources (organiser_id, name, capacity, description, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [organiser_id, name, capacity || 1, description, is_active !== false]
    );

    res.status(201).json({
      success: true,
      resource: result.rows[0]
    });
  } catch (err) {
    console.error("Create resource error:", err);
    res.status(500).json({ success: false, message: "Failed to create resource", error: err.message });
  }
};

/**
 * GET ALL RESOURCES BY ORGANISER
 * GET /api/resources
 */
const getResourcesByOrganiser = async (req, res) => {
  const organiser_id = req.user_id;

  try {
    const result = await pool.query(
      `SELECT * FROM resources WHERE organiser_id = $1 ORDER BY name`,
      [organiser_id]
    );

    res.json({
      success: true,
      resources: result.rows
    });
  } catch (err) {
    console.error("Get resources error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch resources" });
  }
};

/**
 * GET ALL RESOURCES (PUBLIC)
 * GET /api/resources/all
 */
const getAllResources = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.full_name as organiser_name 
       FROM resources r 
       LEFT JOIN users u ON r.organiser_id = u.id 
       WHERE r.is_active = true 
       ORDER BY r.name`
    );

    res.json({
      success: true,
      resources: result.rows
    });
  } catch (err) {
    console.error("Get all resources error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch resources" });
  }
};

/**
 * GET RESOURCE BY ID
 * GET /api/resources/:id
 */
const getResourceById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM resources WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    res.json({
      success: true,
      resource: result.rows[0]
    });
  } catch (err) {
    console.error("Get resource error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch resource" });
  }
};

/**
 * UPDATE RESOURCE
 * PUT /api/resources/:id
 */
const updateResource = async (req, res) => {
  const { id } = req.params;
  const { name, capacity, description, is_active } = req.body;
  const organiser_id = req.user_id;

  try {
    const result = await pool.query(
      `UPDATE resources
       SET name = COALESCE($1, name),
           capacity = COALESCE($2, capacity),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active)
       WHERE id = $5 AND organiser_id = $6
       RETURNING *`,
      [name, capacity, description, is_active, id, organiser_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Resource not found or unauthorized" });
    }

    res.json({
      success: true,
      resource: result.rows[0]
    });
  } catch (err) {
    console.error("Update resource error:", err);
    res.status(500).json({ success: false, message: "Failed to update resource" });
  }
};

/**
 * DELETE RESOURCE
 * DELETE /api/resources/:id
 */
const deleteResource = async (req, res) => {
  const { id } = req.params;
  const organiser_id = req.user_id;

  try {
    const result = await pool.query(
      `DELETE FROM resources WHERE id = $1 AND organiser_id = $2 RETURNING *`,
      [id, organiser_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Resource not found or unauthorized" });
    }

    res.json({
      success: true,
      message: "Resource deleted successfully"
    });
  } catch (err) {
    console.error("Delete resource error:", err);
    res.status(500).json({ success: false, message: "Failed to delete resource" });
  }
};

module.exports = {
  createResource,
  getResourcesByOrganiser,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource
};

const express = require("express");
const router = express.Router();
const {
  createResource,
  getResourcesByOrganiser,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource
} = require("../controllers/resource.controller");

// CREATE - Create a new resource
router.post("/", createResource);

// READ - Get all resources (public)
router.get("/all", getAllResources);

// READ - Get resources by organiser (requires auth)
router.get("/", getResourcesByOrganiser);

// READ - Get resource by ID
router.get("/:id", getResourceById);

// UPDATE - Update a resource
router.put("/:id", updateResource);

// DELETE - Delete a resource
router.delete("/:id", deleteResource);

module.exports = router;

const express = require("express");
const {
  createProject,
  getProjects,
  getProjectById,
  getUserProjects,
  updateProject,
  deleteProject,
  toggleProjectLike,
} = require("../controllers/project.controller");
const { protect } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.route("/").get(getProjects).post(protect, upload.single("image"), createProject);
router.get("/user/:userId", getUserProjects);
router.patch("/:id/like", protect, toggleProjectLike);
router
  .route("/:id")
  .get(getProjectById)
  .patch(protect, upload.single("image"), updateProject)
  .delete(protect, deleteProject);

module.exports = router;

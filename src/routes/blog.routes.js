const express = require("express");
const {
  createBlog,
  getBlogs,
  getBlogBySlug,
  getUserBlogs,
  updateBlog,
  deleteBlog,
  toggleBlogLike,
} = require("../controllers/blog.controller");
const { protect } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.route("/").get(getBlogs).post(protect, upload.single("coverImage"), createBlog);
router.get("/user/:userId", getUserBlogs);
router.get("/slug/:slug", getBlogBySlug);
router.patch("/:id/like", protect, toggleBlogLike);
router
  .route("/:id")
  .patch(protect, upload.single("coverImage"), updateBlog)
  .delete(protect, deleteBlog);

module.exports = router;

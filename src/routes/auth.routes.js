const express = require("express");
const {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", protect, logout);
router.get("/me", protect, getCurrentUser);

module.exports = router;

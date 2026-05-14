const express = require("express");
const upload = require("../middlewares/upload.middleware");


const {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  updateProfileImages
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", protect, logout);
router.get("/me", protect, getCurrentUser);
router.patch("/profile", protect, updateProfile);
router.patch(
  "/profile/images",
  protect,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  updateProfileImages
);



module.exports = router;

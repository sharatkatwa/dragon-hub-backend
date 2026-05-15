const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

const getUsers = asyncHandler(async (req, res) => {
  const { search, skill, sort = "latest" } = req.query;
  const query = {};
  let sortOptions = { createdAt: -1 };

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { fullName: { $regex: search, $options: "i" } },
      { bio: { $regex: search, $options: "i" } },
      { skills: { $regex: search, $options: "i" } },
    ];
  }

  if (skill) {
    const skills = skill
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    query.skills = { $in: skills };
  }

  if (sort === "oldest") {
    sortOptions = { createdAt: 1 };
  }

  const users = await User.find(query)
    .select("username fullName bio avatar banner skills socialLinks createdAt")
    .sort(sortOptions);

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "username fullName bio avatar banner skills socialLinks createdAt"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    user,
  });
});

module.exports = {
  getUsers,
  getUserById,
};

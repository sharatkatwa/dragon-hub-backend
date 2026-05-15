const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const imagekit = require("../config/imagekit");

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
};

const generateAccessToken = (userId) => {
  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

  if (!accessTokenSecret) {
    throw new ApiError(500, "ACCESS_TOKEN_SECRET is not defined");
  }

  return jwt.sign({ id: userId }, accessTokenSecret, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
};

const generateRefreshToken = (userId) => {
  const refreshTokenSecret =
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;

  if (!refreshTokenSecret) {
    throw new ApiError(500, "REFRESH_TOKEN_SECRET is not defined");
  }

  return jwt.sign({ id: userId }, refreshTokenSecret, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const createTokens = async (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  await User.findByIdAndUpdate(userId, { refreshToken });

  return { accessToken, refreshToken };
};

const sendAuthResponse = async (res, statusCode, user, message) => {
  const { accessToken, refreshToken } = await createTokens(user._id);

  setAuthCookies(res, accessToken, refreshToken);

  res.status(statusCode).json({
    success: true,
    message,
    // accessToken,
    // refreshToken,
    user,
  });
};

const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;
  console.log(req.body);

  if (!username || !email || !password) {
    throw new ApiError(400, "Username, email, and password are required");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName,
  });

  // again fetched the user because I need to minus(-) the password from the user
  const createdUser = await User.findById(user._id);

  await sendAuthResponse(res, 201, createdUser, "User registered successfully");
});

const login = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    throw new ApiError(400, "Email or username and password are required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const loggedInUser = await User.findById(user._id);

  await sendAuthResponse(res, 200, loggedInUser, "User logged in successfully");
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
  });

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const refreshTokenSecret =
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;

  if (!refreshTokenSecret) {
    throw new ApiError(500, "REFRESH_TOKEN_SECRET is not defined");
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(incomingRefreshToken, refreshTokenSecret);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decodedToken.id).select("+refreshToken");

  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const { accessToken, refreshToken } = await createTokens(user._id);
  const refreshedUser = await User.findById(user._id);

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: "Access token refreshed successfully",
    // accessToken,
    // refreshToken,
    user: refreshedUser,
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, bio, skills, socialLinks } = req.body;
  const updateData = {};

  if (fullName !== undefined) {
    updateData.fullName = fullName;
  }

  if (bio !== undefined) {
    updateData.bio = bio;
  }

  if (skills !== undefined) {
    updateData.skills = Array.isArray(skills)
      ? skills
      : skills.split(",").map((skill) => skill.trim()).filter(Boolean);
  }

  if (socialLinks !== undefined) {
    updateData.socialLinks =
      typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks;
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No profile fields provided");
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

const updateProfileImages = asyncHandler(async (req, res) => {
  const updateData = {};

  if (req.files?.avatar?.[0]) {
    const avatarFile = req.files.avatar[0];

    const uploadedAvatar = await imagekit.upload({
      file: avatarFile.buffer,
      fileName: `avatar-${req.user._id}-${Date.now()}`,
      folder: "/devhub/avatars",
    });

    updateData.avatar = uploadedAvatar.url;
  }

  if (req.files?.banner?.[0]) {
    const bannerFile = req.files.banner[0];

    const uploadedBanner = await imagekit.upload({
      file: bannerFile.buffer,
      fileName: `banner-${req.user._id}-${Date.now()}`,
      folder: "/devhub/banners",
    });

    updateData.banner = uploadedBanner.url;
  }

  // if (!updateData.avatar && !updateData.banner) {
  //   throw new ApiError(400, "Avatar or banner image is required");
  // }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Profile images updated successfully",
    user,
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  updateProfileImages,
};

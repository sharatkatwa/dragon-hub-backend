const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;
  const token = req.cookies?.accessToken || bearerToken;

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

  if (!accessTokenSecret) {
    throw new ApiError(500, "ACCESS_TOKEN_SECRET is not defined");
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, accessTokenSecret);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const user = await User.findById(decodedToken.id);

  if (!user) {
    throw new ApiError(401, "Invalid or expired token");
  }

  req.user = user;
  next();
});

module.exports = {
  protect,
};

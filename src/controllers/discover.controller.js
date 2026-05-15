const Project = require("../models/project.model");
const Blog = require("../models/blog.model");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");

const getDiscoverFeed = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 6;

  const latestProjects = await Project.find()
    .populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 })
    .limit(limit);

  const trendingProjects = await Project.aggregate([
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    { $sort: { likesCount: -1, createdAt: -1 } },
    { $limit: limit },
  ]);

  await Project.populate(trendingProjects, {
    path: "owner",
    select: "username fullName avatar",
  });

  const latestBlogs = await Blog.find({ isPublished: true })
    .populate("author", "username fullName avatar")
    .sort({ createdAt: -1 })
    .limit(limit);

  const trendingBlogs = await Blog.aggregate([
    { $match: { isPublished: true } },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    { $sort: { likesCount: -1, createdAt: -1 } },
    { $limit: limit },
  ]);

  await Blog.populate(trendingBlogs, {
    path: "author",
    select: "username fullName avatar",
  });

  const topDevelopers = await User.find()
    .select("username fullName bio avatar banner skills socialLinks createdAt")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    latestProjects,
    trendingProjects,
    latestBlogs,
    trendingBlogs,
    topDevelopers,
  });
});

module.exports = {
  getDiscoverFeed,
};

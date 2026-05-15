const Project = require("../models/project.model");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const imagekit = require("../config/imagekit");

const parseArrayField = (value) => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const uploadProjectImage = async (file, userId) => {
  if (!file) return "";

  const uploadedImage = await imagekit.upload({
    file: file.buffer,
    fileName: `project-${userId}-${Date.now()}`,
    folder: "/devhub/projects",
  });

  return uploadedImage.url;
};

const createProject = asyncHandler(async (req, res) => {
  const { title, description, githubUrl, liveUrl } = req.body;
  const techStack = parseArrayField(req.body.techStack);
  const tags = parseArrayField(req.body.tags);

  if (!title || !description || !techStack?.length) {
    throw new ApiError(400, "Title, description, and tech stack are required");
  }

  const image = await uploadProjectImage(req.file, req.user._id);

  const project = await Project.create({
    title,
    description,
    techStack,
    githubUrl,
    liveUrl,
    image,
    tags,
    owner: req.user._id,
  });

  const createdProject = await Project.findById(project._id).populate(
    "owner",
    "username fullName avatar"
  );

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    project: createdProject,
  });
});

const getProjects = asyncHandler(async (req, res) => {
  const { search, tech, tag, sort = "latest" } = req.query;
  const query = {};
  let sortOptions = { createdAt: -1 };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (tech) {
    query.techStack = { $in: parseArrayField(tech) };
  }

  if (tag) {
    query.tags = { $in: parseArrayField(tag) };
  }

  if (sort === "oldest") {
    sortOptions = { createdAt: 1 };
  }

  const projects = await Project.find(query)
    .populate("owner", "username fullName avatar")
    .sort(sortOptions);

  const sortedProjects =
    sort === "popular"
      ? projects.sort((a, b) => b.likes.length - a.likes.length)
      : projects;

  res.status(200).json({
    success: true,
    count: sortedProjects.length,
    projects: sortedProjects,
  });
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate(
    "owner",
    "username fullName avatar"
  );

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  res.status(200).json({
    success: true,
    project,
  });
});

const getUserProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ owner: req.params.userId })
    .populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: projects.length,
    projects,
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can update only your own project");
  }

  const allowedFields = ["title", "description", "githubUrl", "liveUrl"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const techStack = parseArrayField(req.body.techStack);
  const tags = parseArrayField(req.body.tags);  

  if (techStack !== undefined) updateData.techStack = techStack;
  if (tags !== undefined) updateData.tags = tags;

  if (req.file) {
    updateData.image = await uploadProjectImage(req.file, req.user._id);
  }

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).populate("owner", "username fullName avatar");

  res.status(200).json({
    success: true,
    message: "Project updated successfully",
    project: updatedProject,
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can delete only your own project");
  }

  await project.deleteOne();

  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
  });
});

const toggleProjectLike = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const userId = req.user._id.toString();
  const isLiked = project.likes.some((like) => like.toString() === userId);

  if (isLiked) {
    project.likes = project.likes.filter((like) => like.toString() !== userId);
  } else {
    project.likes.push(req.user._id);
  }

  await project.save();

  res.status(200).json({
    success: true,
    message: isLiked ? "Project unliked successfully" : "Project liked successfully",
    liked: !isLiked,
    likesCount: project.likes.length,
  });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  getUserProjects,
  updateProject,
  deleteProject,
  toggleProjectLike,
};

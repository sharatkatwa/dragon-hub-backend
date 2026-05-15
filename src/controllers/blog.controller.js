const Blog = require("../models/blog.model");
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

const createSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const createUniqueSlug = async (title, blogIdToIgnore = null) => {
  const baseSlug = createSlug(title);
  let slug = baseSlug;
  let count = 1;

  while (
    await Blog.findOne({
      slug,
      ...(blogIdToIgnore ? { _id: { $ne: blogIdToIgnore } } : {}),
    })
  ) {
    slug = `${baseSlug}-${count}`;
    count += 1;
  }

  return slug;
};

const uploadCoverImage = async (file, userId) => {
  if (!file) return "";

  const uploadedImage = await imagekit.upload({
    file: file.buffer,
    fileName: `blog-cover-${userId}-${Date.now()}`,
    folder: "/devhub/blogs",
  });

  return uploadedImage.url;
};

const createBlog = asyncHandler(async (req, res) => {
  const { title, content, excerpt, category } = req.body;
  const tags = parseArrayField(req.body.tags);

  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }

  const slug = await createUniqueSlug(title);
  const coverImage = await uploadCoverImage(req.file, req.user._id);

  const blog = await Blog.create({
    title,
    slug,
    content,
    excerpt,
    category,
    tags,
    coverImage,
    author: req.user._id,
    isPublished: req.body.isPublished ?? true,
    publishedAt: req.body.isPublished === false ? null : new Date(),
  });

  const createdBlog = await Blog.findById(blog._id).populate(
    "author",
    "username fullName avatar"
  );

  res.status(201).json({
    success: true,
    message: "Blog created successfully",
    blog: createdBlog,
  });
});

const getBlogs = asyncHandler(async (req, res) => {
  const { search, tag, category, sort = "latest" } = req.query;
  const query = { isPublished: true };
  let sortOptions = { createdAt: -1 };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
    ];
  }

  if (tag) {
    query.tags = { $in: parseArrayField(tag) };
  }

  if (category) {
    query.category = { $regex: `^${category}$`, $options: "i" };
  }

  if (sort === "oldest") {
    sortOptions = { createdAt: 1 };
  }

  const blogs = await Blog.find(query)
    .populate("author", "username fullName avatar")
    .sort(sortOptions);

  const sortedBlogs =
    sort === "popular"
      ? blogs.sort((a, b) => b.likes.length - a.likes.length)
      : blogs;

  res.status(200).json({
    success: true,
    count: sortedBlogs.length,
    blogs: sortedBlogs,
  });
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({
    slug: req.params.slug,
    isPublished: true,
  }).populate("author", "username fullName avatar");

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  res.status(200).json({
    success: true,
    blog,
  });
});

const getUserBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ author: req.params.userId })
    .populate("author", "username fullName avatar")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: blogs.length,
    blogs,
  });
});

const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  if (blog.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can update only your own blog");
  }

  const allowedFields = ["title", "content", "excerpt", "category", "isPublished"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  if (req.body.title !== undefined) {
    updateData.slug = await createUniqueSlug(req.body.title, blog._id);
  }

  const tags = parseArrayField(req.body.tags);
  if (tags !== undefined) updateData.tags = tags;

  if (req.file) {
    updateData.coverImage = await uploadCoverImage(req.file, req.user._id);
  }

  if (req.body.isPublished === true && !blog.publishedAt) {
    updateData.publishedAt = new Date();
  }

  const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate("author", "username fullName avatar");

  res.status(200).json({
    success: true,
    message: "Blog updated successfully",
    blog: updatedBlog,
  });
});

const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  if (blog.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can delete only your own blog");
  }

  await blog.deleteOne();

  res.status(200).json({
    success: true,
    message: "Blog deleted successfully",
  });
});

const toggleBlogLike = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  const userId = req.user._id.toString();
  const isLiked = blog.likes.some((like) => like.toString() === userId);

  if (isLiked) {
    blog.likes = blog.likes.filter((like) => like.toString() !== userId);
  } else {
    blog.likes.push(req.user._id);
  }

  await blog.save();

  res.status(200).json({
    success: true,
    message: isLiked ? "Blog unliked successfully" : "Blog liked successfully",
    liked: !isLiked,
    likesCount: blog.likes.length,
  });
});

module.exports = {
  createBlog,
  getBlogs,
  getBlogBySlug,
  getUserBlogs,
  updateBlog,
  deleteBlog,
  toggleBlogLike,
};

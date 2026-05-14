const asyncHandler = (handleController) => {
  return (req, res, next) =>
    Promise.resolve(handleController(req, res, next)).catch(next);
};

module.exports = asyncHandler;

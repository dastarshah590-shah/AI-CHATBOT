export const sendSuccess = (res, data = {}, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    ...data
  });
};

export const sendError = (res, message, statusCode = 400, details = undefined) => {
  res.status(statusCode).json({
    success: false,
    message,
    details
  });
};

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const normalizeDoc = (doc) => {
  if (!doc) {
    return null;
  }

  const value = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const id = value._id?.toString?.() || value.id;
  const { _id, __v, passwordHash, ...rest } = value;

  return {
    id,
    ...rest
  };
};

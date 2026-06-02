export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: { message: "Invalid request body", details: result.error.flatten() } });
    }
    req.body = result.data;
    return next();
  };
}

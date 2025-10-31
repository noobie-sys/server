import jwt from "jsonwebtoken";

export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header (format: "Bearer <token>")
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    // Verify the token
    if (!token) {
      return res.status(401).json({
        message: "Unauthorize!",
        data: null,
      });
    }
    // decode the token and get the users details
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to request object

    if (!decoded) {
      return res.status(401).json({
        message: "Unauthorize!",
        data: null,
      });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    // Proceed to the next middleware/route handler
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorize!",
      data: null,
    });
  }
};

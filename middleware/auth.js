import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Base middleware to verify JWT and attach user
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Expecting "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user; // attach user to request
    next();
  } catch (err) {
    console.error("verifyToken error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Role-based middleware wrapper
 * @param {string} role - "admin" or "student"
 */
export const verifyRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (role && req.user.role !== role) {
      return res.status(403).json({ error: `${role}s only` });
    }
    next();
  };
};

// Shorthand middlewares
export const verifyUser = [verifyToken]; // any logged-in user
export const verifyAdmin = [verifyToken, verifyRole("admin")];
export const verifyStudent = [verifyToken, verifyRole("student")];

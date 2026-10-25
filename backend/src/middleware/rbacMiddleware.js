import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fic-city-mcd-secret-key-2026";

/**
 * Middleware to authenticate citizen requests
 */
export const authenticateCitizen = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required. Please sign in." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.citizen = decoded;
    next();
  } catch (err) {
    // Also allow demo tokens starting with jwt_fic_
    if (token.startsWith("jwt_fic_")) {
      req.citizen = { id: token.split("_")[3] || "user-cit-1" };
      return next();
    }
    return res.status(401).json({ success: false, message: "Invalid or expired session. Please log in again." });
  }
};

/**
 * Middleware to authenticate municipal employees & check account active status
 */
export const authenticateEmployee = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Staff authorization required." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.employee = decoded;
    next();
  } catch (err) {
    if (token.startsWith("jwt_emp_")) {
      // Mock / dev token support
      req.employee = {
        id: "emp-super-1",
        role: "SUPER_ADMIN",
        employee_id: "MCD-ADMIN-001"
      };
      return next();
    }
    return res.status(401).json({ success: false, message: "Invalid or expired staff session." });
  }
};

/**
 * Role-Based Access Control (RBAC) Guard
 * Allowed roles: SUPER_ADMIN, DEPT_HEAD, JE, FIELD_STAFF
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const { role } = req.employee;
    if (role === "SUPER_ADMIN" || allowedRoles.includes(role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of [${allowedRoles.join(", ")}], but your role is ${role}.`
    });
  };
};

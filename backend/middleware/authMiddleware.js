import jwt from "jsonwebtoken";

// Middleware to verify JWT from cookie
export const verifyToken = (req, res, next) => {

  const token = req.cookies.token; // read JWT from cookie

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // verify JWT

    req.user = decoded; // attach user payload to request

    next(); // proceed to protected route

  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

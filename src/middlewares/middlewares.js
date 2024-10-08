const security = require("../security/security");

exports.isAdmin = async (req, res, next) => {
  const tokenString = req.headers.authorization?.replace("Bearer ", "");

  if (!tokenString) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  try {
    const userType = await security.verifyToken(tokenString);

    if (userType === "admin") {
      return next();
    } else {
      return res.status(403).json({ error: "Not authorized" });
    }
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
};

exports.isProfessor = async (req, res, next) => {
  const tokenString = req.headers.authorization?.replace("Bearer ", "");

  if (!tokenString) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  try {
    const userType = await security.verifyToken(tokenString);

    if (userType === "professor") {
      return next();
    } else {
      return res.status(403).json({ error: "Not authorized" });
    }
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
};

exports.isStudent = async (req, res, next) => {
  const tokenString = req.headers.authorization?.replace("Bearer ", "");

  if (!tokenString) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  try {
    const userType = await security.verifyToken(tokenString);

    if (userType === "student") {
      return next();
    } else {
      return res.status(403).json({ error: "Not authorized" });
    }
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
};

const authorizeRole = (roles) => { // 'roles' is an array of allowed roles
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' }); // No user, not logged in
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' }); // User's role is not allowed
    }

    next(); // User is authorized, proceed to the route
    console.log(`AuthorizeRole: User role is "${req.user.role}", required roles: ${roles.join(', ')}`); // ✨ ADD THIS LOG!

        if (!roles.includes(req.user.role)) {
            console.log('AuthorizeRole: Access denied - role mismatch'); // ✨ ADD THIS LOG!
            return res.status(403).json({ message: 'Access denied: You do not have the required role.' });
        }

        console.log('AuthorizeRole: Role authorized, proceeding to next middleware'); // ✨ ADD THIS LOG!
        next();
  };
};

module.exports = authorizeRole;
/**
 * Exige que req.user.is_superadmin sea true.
 * Usar después de authenticate.
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user?.is_superadmin) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Acceso exclusivo de administrador',
    });
  }

  return next();
}

module.exports = requireSuperAdmin;

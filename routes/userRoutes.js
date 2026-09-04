const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getUsers,
  getTrashedUsers,
  deleteUser,
  restoreUser,
  permanentDeleteUser,
} = require('../controllers/userController');

// All user routes require a valid JWT + admin role
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

router.use(authMiddleware);
router.use(adminOnly);

router.get('/', getUsers);
router.get('/trash', getTrashedUsers);
router.delete('/:id', deleteUser);
router.put('/:id/restore', restoreUser);
router.delete('/:id/permanent', permanentDeleteUser);

module.exports = router;

const db = require('../config/db');

// GET /api/users — admin only: list all active (non-deleted) users
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/users/trash — admin only: list soft-deleted users
exports.getTrashedUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at, deleted_at FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/users/:id — soft-delete (move to trash)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  // Prevent self-delete
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  try {
    const [result] = await db.query(
      'UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or already deleted' });
    }
    res.json({ message: 'User moved to trash' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/users/:id/restore — restore from trash
exports.restoreUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE users SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found in trash' });
    }
    res.json({ message: 'User restored' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/users/:id/permanent — hard delete
exports.permanentDeleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

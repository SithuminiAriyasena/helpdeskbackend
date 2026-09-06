const express = require('express');
const { getTickets, createTicket, updateTicket, deleteTicket } = require('../controllers/ticketController');
const { reply } = require('../controllers/emailController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// All ticket routes require a valid JWT
router.use(authMiddleware);

router.get('/', getTickets);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);
// POST /api/tickets/reply - send an email reply to user (admin only)
router.post('/reply', reply);

module.exports = router;

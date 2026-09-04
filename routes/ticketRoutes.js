const express = require('express');
const { getTickets, createTicket, updateTicket, deleteTicket } = require('../controllers/ticketController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// All ticket routes require a valid JWT
router.use(authMiddleware);

router.get('/', getTickets);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

module.exports = router;

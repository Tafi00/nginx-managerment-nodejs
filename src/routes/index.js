const express = require('express');
const domainRoutes = require('./domainRoutes');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Thông tin API
 *     tags: [Info]
 *     responses:
 *       200:
 *         description: Thông tin cơ bản của API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Nginx Configuration Management API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
// Đường dẫn cơ bản API
router.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Nginx Configuration Management API',
    version: '1.0.0'
  });
});

// Sử dụng middleware xác thực cho tất cả các routes domains
router.use('/domains', authenticateToken, domainRoutes);

module.exports = router; 
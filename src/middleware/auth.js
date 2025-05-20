const logger = require('../utils/logger');

/**
 * Middleware kiểm tra token xác thực
 * Chấp nhận token từ header 'Authorization' dạng 'Bearer TOKEN'
 * hoặc từ query parameter 'token'
 */
function authenticateToken(req, res, next) {
  // Lấy token từ header hoặc query parameter
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.split(' ')[1] : req.query.token;

  // Config token từ biến môi trường, mặc định là chuỗi rỗng
  const adminToken = process.env.ADMIN_TOKEN || '';

  // Nếu không có token hoặc biến môi trường ADMIN_TOKEN chưa được cấu hình
  if (!token || !adminToken) {
    logger.warn(`Authentication failed: ${!token ? 'No token provided' : 'No admin token configured'}`);
    return res.status(401).json({
      success: false,
      message: 'Không có quyền truy cập. Vui lòng cung cấp token hợp lệ.'
    });
  }

  // Kiểm tra token có khớp với ADMIN_TOKEN không
  if (token !== adminToken) {
    logger.warn(`Authentication failed: Invalid token`);
    return res.status(403).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn.'
    });
  }

  // Token hợp lệ, cho phép request tiếp tục
  logger.info(`Authenticated request from ${req.ip}`);
  next();
}

module.exports = authenticateToken; 
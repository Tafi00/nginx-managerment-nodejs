const app = require('./app');
const config = require('./utils/config');
const logger = require('./utils/logger');

// Khởi động server
const server = app.listen(config.port, () => {
  logger.info(`Server đang chạy trên cổng ${config.port}`);
});

// Xử lý tắt server
process.on('SIGTERM', () => {
  logger.info('SIGTERM nhận được. Đang tắt server...');
  server.close(() => {
    logger.info('Server đã tắt');
    process.exit(0);
  });
});

// Xử lý lỗi không bắt được
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  logger.error(error.stack);
  
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection tại:', promise);
  logger.error(`Lý do: ${reason}`);
  
  process.exit(1);
}); 
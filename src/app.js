const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');
const routes = require('./routes');
const logger = require('./utils/logger');
const setupSwagger = require('./utils/swagger');

// Tải biến môi trường
dotenv.config();

// Tạo ứng dụng Express
const app = express();

// Middleware
app.use(cors()); // Sử dụng CORS mặc định
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(process.cwd(), 'logs', 'access.log'), { flags: 'a' })
}));
app.use(morgan('dev'));

// Thiết lập Swagger documentation
setupSwagger(app);

// Sử dụng API routes
app.use('/api', routes);

// Middleware xử lý lỗi 404
app.use((req, res, next) => {
  const error = new Error('Không tìm thấy');
  error.status = 404;
  next(error);
});

// Middleware xử lý lỗi
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message
  });
});

module.exports = app; 
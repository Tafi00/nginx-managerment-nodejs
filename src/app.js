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

// Cấu hình CORS
const corsOptions = {
  origin: '*', // Cho phép tất cả các nguồn gốc
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true,
  allowedHeaders: 'Content-Type,Authorization'
};

// Middleware
app.use(cors(corsOptions));

// Middleware để đặt các header CORS cho mỗi response
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Xử lý request OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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
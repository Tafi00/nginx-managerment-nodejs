const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');

// Cấu hình Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Quản lý cấu hình Nginx',
      version: '1.0.0',
      description: 'API quản lý cấu hình Nginx để gắn domain cho các subfolder',
      contact: {
        name: 'Admin',
        email: 'admin@example.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: `http://61.28.231.29:${config.port}/api`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'query',
          name: 'token'
        }
      },
      schemas: {
        Domain: {
          type: 'object',
          required: ['domain', 'subfolder'],
          properties: {
            domain: {
              type: 'string',
              description: 'Tên domain'
            },
            subfolder: {
              type: 'string',
              description: 'Tên subfolder trên localhost'
            },
            ssl: {
              type: 'boolean',
              description: 'Trạng thái SSL'
            },
            enabled: {
              type: 'boolean',
              description: 'Trạng thái kích hoạt domain'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian tạo'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian cập nhật gần nhất'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string'
            },
            error: {
              type: 'string'
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      },
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

function setupSwagger(app) {
  // Cung cấp API documentation UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Cung cấp API specification dạng JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log(`Swagger documentation available at http://61.28.231.29:${config.port}/api-docs`);
}

module.exports = setupSwagger; 
const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

// Cấu hình Swagger giống như trong swagger.js
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
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

// Tạo Swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Xuất ra file JSON
const outputPath = path.join(process.cwd(), 'docs', 'swagger.json');
fs.ensureDirSync(path.dirname(outputPath));
fs.writeJsonSync(outputPath, swaggerSpec, { spaces: 2 });

console.log(`Swagger documentation đã được xuất ra file: ${outputPath}`);

// Xuất ra file HTML
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Quản lý cấu hình Nginx - Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        supportedSubmitMethods: []
      });
      window.ui = ui;
    }
  </script>
</body>
</html>
`;

const htmlOutputPath = path.join(process.cwd(), 'docs', 'index.html');
fs.writeFileSync(htmlOutputPath, htmlContent);

console.log(`Swagger HTML documentation đã được xuất ra file: ${htmlOutputPath}`); 
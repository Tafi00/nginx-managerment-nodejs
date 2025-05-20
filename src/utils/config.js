const dotenv = require('dotenv');
const path = require('path');

// Tải các biến môi trường từ file .env
dotenv.config();

// Mặc định nếu các biến môi trường không được đặt
const config = {
  port: process.env.PORT || 3001,
  nginxConfigPath: process.env.NGINX_CONFIG_PATH || '/etc/nginx/conf.d',
  nginxSitesPath: process.env.NGINX_SITES_PATH || '/etc/nginx/sites-available',
  nginxEnabledPath: process.env.NGINX_ENABLED_PATH || '/etc/nginx/sites-enabled',
  nginxReloadCommand: process.env.NGINX_RELOAD_COMMAND || 'systemctl reload nginx',
  nginxStatusCommand: process.env.NGINX_STATUS_COMMAND || 'systemctl status nginx',
  defaultServerPort: process.env.DEFAULT_SERVER_PORT || 3000,
  domainPrefix: process.env.DOMAIN_PREFIX || 'localhost',
  logLevel: process.env.LOG_LEVEL || 'info',
  adminToken: process.env.ADMIN_TOKEN || 'default_admin_token_change_me'
};

module.exports = config; 
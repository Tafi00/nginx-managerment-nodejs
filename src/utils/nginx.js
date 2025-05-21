const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const logger = require('./logger');
const config = require('./config');

const execPromise = util.promisify(exec);

/**
 * Thực hiện lệnh shell và trả về kết quả
 * @param {string} command - Lệnh cần thực hiện
 * @returns {Promise<string>} - Kết quả từ lệnh
 */
async function executeCommand(command) {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
      logger.warn(`Command stderr: ${stderr}`);
    }
    return stdout;
  } catch (error) {
    logger.error(`Command execution error: ${error.message}`);
    throw error;
  }
}

/**
 * Kiểm tra trạng thái Nginx
 * @returns {Promise<boolean>} - true nếu Nginx đang chạy
 */
async function checkNginxStatus() {
  try {
    await executeCommand(config.nginxStatusCommand);
    return true;
  } catch (error) {
    logger.error('Nginx is not running or not installed');
    return false;
  }
}

/**
 * Tạo cấu hình Nginx cho domain
 * @param {string} domain - Domain cần cấu hình
 * @param {string} subfolder - Subfolder trên localhost
 * @param {boolean} ssl - Có cấu hình SSL hay không
 * @returns {Promise<string>} - Đường dẫn đến file cấu hình
 */
async function createNginxConfig(domain, subfolder, ssl = false) {
  const configPath = path.join(config.nginxSitesPath, `${domain}.conf`);
  
  let configContent = '';
  if (ssl) {
    // Đối với SSL, chúng ta để Certbot tự cấu hình
    configContent = `server {
    listen 80;
    server_name ${domain};
    
    # 1. Proxy các asset tĩnh của Next.js
    location ~ ^/_next/ {
        proxy_pass http://${config.domainPrefix}:${config.defaultServerPort}$request_uri;
        proxy_set_header Host ${config.domainPrefix}:${config.defaultServerPort};
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_ssl_server_name on;
    }

    # 2. Proxy bất kỳ file /static/ hoặc /public/ nếu có
    location ~ ^/(static|public)/ {
        proxy_pass http://${config.domainPrefix}:${config.defaultServerPort}$request_uri;
        proxy_set_header Host ${config.domainPrefix}:${config.defaultServerPort};
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_ssl_server_name on;
    }

    # 3. Proxy trang bài viết chính
    location / {
        proxy_pass http://${config.domainPrefix}:${config.defaultServerPort}/${subfolder};
        proxy_set_header Host ${config.domainPrefix}:${config.defaultServerPort};
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_ssl_server_name on;

        # sửa các đường dẫn tương đối thành đường dẫn gốc
        sub_filter_once off;
        sub_filter 'href="/' 'href="http://${config.domainPrefix}:${config.defaultServerPort}/';
        sub_filter 'src="/'  'src="http://${config.domainPrefix}:${config.defaultServerPort}/';
        sub_filter 'action="/'   'action="http://${config.domainPrefix}:${config.defaultServerPort}/';
        sub_filter 'content="/'  'content="http://${config.domainPrefix}:${config.defaultServerPort}/';
    }
}`;
  } else {
    configContent = `server {
    listen 80;
    server_name ${domain};
    
    # 1. Proxy các asset tĩnh của Next.js
    location ~ ^/_next/ {
        proxy_pass http://${config.domainPrefix}:${config.defaultServerPort}$request_uri;
        proxy_set_header Host ${config.domainPrefix}:${config.defaultServerPort};
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_ssl_server_name on;
    }

    # 2. Proxy bất kỳ file /static/ hoặc /public/ nếu có
    location ~ ^/(static|public)/ {
        proxy_pass http://${config.domainPrefix}:${config.defaultServerPort}$request_uri;
        proxy_set_header Host ${config.domainPrefix}:${config.defaultServerPort};
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_ssl_server_name on;
    }

    # 3. Proxy trang bài viết chính
    location / {
        proxy_pass http://${config.domainPrefix}:${config.defaultServerPort}/${subfolder};
        proxy_set_header Host ${config.domainPrefix}:${config.defaultServerPort};
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_ssl_server_name on;

        # sửa các đường dẫn tương đối thành đường dẫn gốc
        sub_filter_once off;
        sub_filter 'href="/' 'href="http://${config.domainPrefix}:${config.defaultServerPort}/';
        sub_filter 'src="/'  'src="http://${config.domainPrefix}:${config.defaultServerPort}/';
        sub_filter 'action="/'   'action="http://${config.domainPrefix}:${config.defaultServerPort}/';
        sub_filter 'content="/'  'content="http://${config.domainPrefix}:${config.defaultServerPort}/';
    }
}`;
  }
  
  await fs.writeFile(configPath, configContent);
  logger.info(`Created Nginx configuration for ${domain}`);
  
  return configPath;
}

/**
 * Kích hoạt cấu hình Nginx
 * @param {string} domain - Domain cần kích hoạt
 * @returns {Promise<boolean>} - true nếu thành công
 */
async function enableNginxConfig(domain) {
  try {
    const sitesAvailable = path.join(config.nginxSitesPath, `${domain}.conf`);
    const sitesEnabled = path.join(config.nginxEnabledPath, `${domain}.conf`);
    
    // Kiểm tra xem file cấu hình có tồn tại không
    if (!await fs.pathExists(sitesAvailable)) {
      logger.error(`Configuration file for ${domain} does not exist`);
      return false;
    }
    
    // Tạo symlink
    await fs.symlink(sitesAvailable, sitesEnabled);
    logger.info(`Enabled Nginx configuration for ${domain}`);
    
    // Kiểm tra cấu hình Nginx
    await executeCommand('nginx -t');
    
    // Reload Nginx
    await executeCommand(config.nginxReloadCommand);
    logger.info('Nginx reloaded successfully');
    
    return true;
  } catch (error) {
    logger.error(`Failed to enable Nginx configuration: ${error.message}`);
    return false;
  }
}

/**
 * Vô hiệu hóa cấu hình Nginx
 * @param {string} domain - Domain cần vô hiệu hóa
 * @returns {Promise<boolean>} - true nếu thành công
 */
async function disableNginxConfig(domain) {
  try {
    const sitesEnabled = path.join(config.nginxEnabledPath, `${domain}.conf`);
    
    // Kiểm tra xem symlink có tồn tại không
    if (!await fs.pathExists(sitesEnabled)) {
      logger.error(`Enabled configuration for ${domain} does not exist`);
      return false;
    }
    
    // Xóa symlink
    await fs.unlink(sitesEnabled);
    logger.info(`Disabled Nginx configuration for ${domain}`);
    
    // Reload Nginx
    await executeCommand(config.nginxReloadCommand);
    logger.info('Nginx reloaded successfully');
    
    return true;
  } catch (error) {
    logger.error(`Failed to disable Nginx configuration: ${error.message}`);
    return false;
  }
}

/**
 * Cài đặt SSL cho domain sử dụng Let's Encrypt
 * @param {string} domain - Domain cần cài SSL
 * @param {string} email - Địa chỉ email
 * @returns {Promise<boolean>} - true nếu thành công
 */
async function installSSL(domain, email) {
  try {
    // Sử dụng certbot để cài SSL
    const command = `certbot --nginx -d ${domain} --non-interactive --agree-tos --email ${email}`;
    await executeCommand(command);
    logger.info(`SSL certificate installed for ${domain}`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to install SSL: ${error.message}`);
    return false;
  }
}

/**
 * Liệt kê tất cả các cấu hình Nginx đang hoạt động
 * @returns {Promise<Array>} - Danh sách domain và trạng thái
 */
async function listNginxConfigs() {
  try {
    const sitesAvailable = await fs.readdir(config.nginxSitesPath);
    const sitesEnabled = await fs.readdir(config.nginxEnabledPath);
    
    const results = [];
    
    for (const file of sitesAvailable) {
      if (file.endsWith('.conf')) {
        const domain = file.replace('.conf', '');
        const isEnabled = sitesEnabled.includes(file);
        
        // Đọc nội dung file để xác định subfolder
        const content = await fs.readFile(path.join(config.nginxSitesPath, file), 'utf8');
        const match = content.match(/proxy_pass http:\/\/.*?:.*?\/(.*?);/);
        const subfolder = match ? match[1] : '';
        
        // Kiểm tra xem có SSL hay không
        const hasSSL = content.includes('listen 443 ssl');
        
        results.push({
          domain,
          subfolder,
          enabled: isEnabled,
          ssl: hasSSL
        });
      }
    }
    
    return results;
  } catch (error) {
    logger.error(`Failed to list Nginx configs: ${error.message}`);
    throw error;
  }
}

/**
 * Thiết lập auto renew cho certbot
 */
async function setupAutoRenew() {
  try {
    // Thêm cron job nếu chưa có (mặc định certbot cài đặt sẽ tự tạo cron, nhưng ta chủ động kiểm tra)
    // Lệnh này sẽ thêm vào crontab nếu chưa có dòng certbot renew
    const checkCmd = `crontab -l | grep 'certbot renew' || (crontab -l 2>/dev/null; echo '0 3 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"') | crontab -`;
    await executeCommand(checkCmd);
    logger.info('Đã thiết lập auto renew cho certbot');
  } catch (error) {
    logger.warn('Không thể thiết lập auto renew cho certbot (có thể đã tồn tại hoặc không có quyền): ' + error.message);
  }
}

module.exports = {
  checkNginxStatus,
  createNginxConfig,
  enableNginxConfig,
  disableNginxConfig,
  installSSL,
  listNginxConfigs,
  setupAutoRenew
}; 
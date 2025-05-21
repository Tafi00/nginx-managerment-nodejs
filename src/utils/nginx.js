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
    
    // Kiểm tra nếu symlink đã tồn tại thì xóa đi
    if (await fs.pathExists(sitesEnabled)) {
      await fs.unlink(sitesEnabled);
      logger.info(`Removed existing symlink for ${domain}`);
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
 * Kiểm tra xem SSL đã được cài đặt chưa
 * @param {string} domain - Domain cần kiểm tra
 * @returns {Promise<boolean>} - true nếu SSL đã được cài đặt
 */
async function checkSSLInstalled(domain) {
  logger.info(`DEBUG checkSSLInstalled: domain=${domain}, sslCertificatesPath=${config.sslCertificatesPath}`);
  const sslCertPath = path.join(config.sslCertificatesPath, domain, 'fullchain.pem');
  try {
    return await fs.pathExists(sslCertPath);
  } catch (error) {
    logger.error(`Error checking SSL certificate: ${error.message}`);
    return false;
  }
}

/**
 * Cài đặt SSL cho domain sử dụng Let's Encrypt
 * @param {string} domain - Domain cần cài SSL
 * @param {string} email - Địa chỉ email
 * @param {string} subfolder - Subfolder trên localhost
 * @returns {Promise<boolean>} - true nếu thành công
 */
async function installSSL(domain, email, subfolder) {
  try {
    // Kiểm tra xem SSL đã được cài đặt chưa
    const sslInstalled = await checkSSLInstalled(domain);
    
    // Sử dụng certbot để cài SSL với auto renew
    // --nginx: sử dụng plugin nginx
    // --non-interactive: không yêu cầu người dùng tương tác
    // --agree-tos: đồng ý với điều khoản dịch vụ
    // --email: địa chỉ email để đăng ký và thông báo
    // --redirect: tự động chuyển hướng HTTP sang HTTPS
    // --keep-until-expiring: giữ lại chứng chỉ hiện có nếu chưa hết hạn
    // --renew-by-default: tự động gia hạn
    // --no-eff-email: không gửi email cho EFF
    const command = `certbot --nginx -d ${domain} --non-interactive --agree-tos --email ${email} --redirect --keep-until-expiring --renew-by-default --no-eff-email`;
    
    await executeCommand(command);
    
    if (sslInstalled) {
      logger.info(`SSL certificate updated for ${domain}`);
    } else {
      logger.info(`SSL certificate installed for ${domain}`);
    }
    
    // Thiết lập auto renew nếu chưa có
    await setupAutoRenew();
    
    return true;
  } catch (error) {
    logger.error(`Failed to install SSL: ${error.message}`);
    return false;
  }
}

/**
 * Thiết lập auto renew cho Let's Encrypt
 * @returns {Promise<boolean>} - true nếu thành công
 */
async function setupAutoRenew() {
  try {
    // Kiểm tra xem cron job cho auto renew đã được thiết lập chưa
    const checkCronCommand = "crontab -l | grep certbot";
    
    try {
      const cronResult = await executeCommand(checkCronCommand);
      
      if (cronResult.includes('certbot renew')) {
        // Cron job đã tồn tại
        logger.info('Certbot auto-renewal already configured');
        return true;
      }
    } catch (error) {
      // Lệnh có thể thất bại nếu không có cron job nào
      logger.info('No existing cron jobs found for certbot');
    }
    
    // Thêm cron job mới để gia hạn chứng chỉ 2 lần mỗi ngày (chuẩn của Let's Encrypt)
    const cronCommand = "(crontab -l 2>/dev/null; echo '0 */12 * * * certbot renew --quiet') | crontab -";
    await executeCommand(cronCommand);
    
    logger.info('Certbot auto-renewal configured successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to setup auto renew: ${error.message}`);
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
        const hasSSL = content.includes('listen 443 ssl') || await checkSSLInstalled(domain);
        
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

module.exports = {
  checkNginxStatus,
  createNginxConfig,
  enableNginxConfig,
  disableNginxConfig,
  installSSL,
  checkSSLInstalled,
  setupAutoRenew,
  listNginxConfigs
}; 
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

const domainsFilePath = path.join(process.cwd(), 'config', 'domains.json');

// Đảm bảo file domains.json tồn tại
fs.ensureFileSync(domainsFilePath);

// Kiểm tra nếu file trống hoặc không có nội dung hợp lệ thì khởi tạo với array rỗng
try {
  const fileContent = fs.readJsonSync(domainsFilePath, { throws: false });
  if (!fileContent || !Array.isArray(fileContent)) {
    fs.writeJsonSync(domainsFilePath, [], { spaces: 2 });
  }
} catch (error) {
  fs.writeJsonSync(domainsFilePath, [], { spaces: 2 });
  logger.info('Created empty domains.json file');
}

/**
 * Lấy danh sách tất cả domain
 * @returns {Promise<Array>} - Danh sách tất cả domain
 */
async function getAllDomains() {
  try {
    const domains = await fs.readJson(domainsFilePath);
    return domains || [];
  } catch (error) {
    logger.error(`Failed to read domains: ${error.message}`);
    return [];
  }
}

/**
 * Tìm domain theo tên
 * @param {string} domain - Tên domain cần tìm
 * @returns {Promise<Object|null>} - Thông tin domain hoặc null nếu không tìm thấy
 */
async function getDomainByName(domain) {
  try {
    const domains = await getAllDomains();
    return domains.find(d => d.domain === domain) || null;
  } catch (error) {
    logger.error(`Failed to get domain by name: ${error.message}`);
    return null;
  }
}

/**
 * Thêm domain mới
 * @param {Object} domainData - Thông tin domain
 * @returns {Promise<boolean>} - true nếu thành công
 */
async function addDomain(domainData) {
  try {
    const domains = await getAllDomains();
    
    // Kiểm tra xem domain đã tồn tại chưa
    if (domains.some(d => d.domain === domainData.domain)) {
      logger.warn(`Domain ${domainData.domain} already exists`);
      return false;
    }
    
    // Thêm timestamp
    domainData.createdAt = new Date().toISOString();
    domainData.updatedAt = new Date().toISOString();
    
    domains.push(domainData);
    await fs.writeJson(domainsFilePath, domains, { spaces: 2 });
    logger.info(`Domain ${domainData.domain} added successfully`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to add domain: ${error.message}`);
    return false;
  }
}

/**
 * Cập nhật thông tin domain
 * @param {string} domain - Tên domain cần cập nhật
 * @param {Object} domainData - Thông tin mới
 * @returns {Promise<boolean>} - true nếu thành công
 */
async function updateDomain(domain, domainData) {
  try {
    const domains = await getAllDomains();
    const index = domains.findIndex(d => d.domain === domain);
    
    if (index === -1) {
      logger.warn(`Domain ${domain} not found`);
      return false;
    }
    
    // Giữ lại createdAt ban đầu
    const createdAt = domains[index].createdAt;
    
    // Cập nhật dữ liệu và updatedAt
    domains[index] = {
      ...domainData,
      createdAt,
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeJson(domainsFilePath, domains, { spaces: 2 });
    logger.info(`Domain ${domain} updated successfully`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to update domain: ${error.message}`);
    return false;
  }
}

/**
 * Xóa domain
 * @param {string} domain - Tên domain cần xóa
 * @returns {Promise<boolean>} - true nếu thành công
 */
async function deleteDomain(domain) {
  try {
    const domains = await getAllDomains();
    const filteredDomains = domains.filter(d => d.domain !== domain);
    
    if (filteredDomains.length === domains.length) {
      logger.warn(`Domain ${domain} not found`);
      return false;
    }
    
    await fs.writeJson(domainsFilePath, filteredDomains, { spaces: 2 });
    logger.info(`Domain ${domain} deleted successfully`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to delete domain: ${error.message}`);
    return false;
  }
}

module.exports = {
  getAllDomains,
  getDomainByName,
  addDomain,
  updateDomain,
  deleteDomain
}; 
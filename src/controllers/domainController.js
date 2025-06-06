const domainModel = require('../models/domain');
const nginxUtils = require('../utils/nginx');
const logger = require('../utils/logger');

/**
 * Lấy danh sách tất cả domain
 */
async function getAllDomains(req, res) {
  try {
    const domains = await domainModel.getAllDomains();
    res.status(200).json({
      success: true,
      data: domains
    });
  } catch (error) {
    logger.error(`Error getting all domains: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách domain',
      error: error.message
    });
  }
}

/**
 * Lấy thông tin chi tiết của một domain
 */
async function getDomain(req, res) {
  try {
    const { domain } = req.params;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Tên domain không được để trống'
      });
    }
    
    const domainInfo = await domainModel.getDomainByName(domain);
    
    if (!domainInfo) {
      return res.status(404).json({
        success: false,
        message: `Domain ${domain} không tồn tại`
      });
    }
    
    res.status(200).json({
      success: true,
      data: domainInfo
    });
  } catch (error) {
    logger.error(`Error getting domain details: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin domain',
      error: error.message
    });
  }
}

/**
 * Tạo domain mới và cấu hình Nginx
 */
async function createDomain(req, res) {
  try {
    const { domain, subfolder } = req.body;
    if (!domain || !subfolder) {
      return res.status(400).json({
        success: false,
        message: 'Domain và subfolder không được để trống'
      });
    }
    // Kiểm tra xem domain đã tồn tại chưa
    const existingDomain = await domainModel.getDomainByName(domain);
    let domainData;
    if (existingDomain) {
      // Nếu đã tồn tại thì update lại subfolder và enabled (giữ ssl)
      domainData = {
        ...existingDomain,
        subfolder,
        enabled: true,
        updatedAt: new Date().toISOString()
      };
      await nginxUtils.createNginxConfig(domain, subfolder, existingDomain.ssl);
      await nginxUtils.enableNginxConfig(domain);
      await domainModel.updateDomain(domain, domainData);
      return res.status(200).json({
        success: true,
        message: `Domain ${domain} đã tồn tại, thông tin đã được cập nhật`,
        data: domainData
      });
    } else {
      // Nếu chưa có thì tạo mới
      await nginxUtils.createNginxConfig(domain, subfolder);
      await nginxUtils.enableNginxConfig(domain);
      domainData = {
        domain,
        subfolder,
        ssl: false,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await domainModel.addDomain(domainData);
      return res.status(201).json({
        success: true,
        message: `Domain ${domain} được tạo thành công`,
        data: domainData
      });
    }
  } catch (error) {
    logger.error(`Error creating domain: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo domain mới',
      error: error.message
    });
  }
}

/**
 * Cập nhật thông tin domain
 */
async function updateDomain(req, res) {
  try {
    const { domain } = req.params;
    const { subfolder, enabled } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Tên domain không được để trống'
      });
    }
    
    // Kiểm tra domain có tồn tại không
    const domainInfo = await domainModel.getDomainByName(domain);
    if (!domainInfo) {
      return res.status(404).json({
        success: false,
        message: `Domain ${domain} không tồn tại`
      });
    }
    
    // Dữ liệu cập nhật
    const updatedData = { ...domainInfo };
    
    if (subfolder !== undefined) {
      updatedData.subfolder = subfolder;
      
      // Tạo lại cấu hình Nginx với subfolder mới
      await nginxUtils.createNginxConfig(domain, subfolder, domainInfo.ssl);
      
      // Nếu domain đang được kích hoạt, reload lại cấu hình
      if (domainInfo.enabled) {
        await nginxUtils.enableNginxConfig(domain);
      }
    }
    
    if (enabled !== undefined) {
      updatedData.enabled = enabled;
      
      if (enabled) {
        await nginxUtils.enableNginxConfig(domain);
      } else {
        await nginxUtils.disableNginxConfig(domain);
      }
    }
    
    // Cập nhật thông tin trong database
    await domainModel.updateDomain(domain, updatedData);
    
    res.status(200).json({
      success: true,
      message: `Domain ${domain} được cập nhật thành công`,
      data: updatedData
    });
  } catch (error) {
    logger.error(`Error updating domain: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật domain',
      error: error.message
    });
  }
}

/**
 * Xóa domain
 */
async function deleteDomain(req, res) {
  try {
    const { domain } = req.params;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Tên domain không được để trống'
      });
    }
    
    // Kiểm tra domain có tồn tại không
    const domainInfo = await domainModel.getDomainByName(domain);
    if (!domainInfo) {
      return res.status(404).json({
        success: false,
        message: `Domain ${domain} không tồn tại`
      });
    }
    
    // Vô hiệu hóa cấu hình Nginx (nếu đang được kích hoạt)
    if (domainInfo.enabled) {
      await nginxUtils.disableNginxConfig(domain);
    }
    
    // Xóa domain khỏi database
    await domainModel.deleteDomain(domain);
    
    res.status(200).json({
      success: true,
      message: `Domain ${domain} đã được xóa thành công`
    });
  } catch (error) {
    logger.error(`Error deleting domain: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa domain',
      error: error.message
    });
  }
}

/**
 * Cài đặt SSL cho domain
 */
async function installSSLForDomain(req, res) {
  try {
    const { domain } = req.params;
    const { email } = req.body;
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Tên domain không được để trống'
      });
    }
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email không được để trống'
      });
    }
    // Kiểm tra domain có tồn tại không
    const domainInfo = await domainModel.getDomainByName(domain);
    if (!domainInfo) {
      return res.status(404).json({
        success: false,
        message: `Domain ${domain} không tồn tại`
      });
    }
    // Nếu đã có SSL thì trả về thành công luôn
    if (domainInfo.ssl) {
      return res.status(200).json({
        success: true,
        message: `SSL đã được cài đặt cho domain ${domain}`,
        data: domainInfo
      });
    }
    // Cài đặt SSL
    const success = await nginxUtils.installSSL(domain, email);
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Không thể cài đặt SSL'
      });
    }
    // Thiết lập auto renew certbot
    await nginxUtils.setupAutoRenew();
    // Cập nhật thông tin domain
    const updatedData = {
      ...domainInfo,
      ssl: true,
      updatedAt: new Date().toISOString()
    };
    await domainModel.updateDomain(domain, updatedData);
    res.status(200).json({
      success: true,
      message: `SSL đã được cài đặt cho domain ${domain}`,
      data: updatedData
    });
  } catch (error) {
    logger.error(`Error installing SSL: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Không thể cài đặt SSL',
      error: error.message
    });
  }
}

/**
 * Kiểm tra trạng thái Nginx
 */
async function checkNginxStatus(req, res) {
  try {
    const isRunning = await nginxUtils.checkNginxStatus();
    
    res.status(200).json({
      success: true,
      data: {
        status: isRunning ? 'running' : 'stopped'
      }
    });
  } catch (error) {
    logger.error(`Error checking Nginx status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra trạng thái Nginx',
      error: error.message
    });
  }
}

module.exports = {
  getAllDomains,
  getDomain,
  createDomain,
  updateDomain,
  deleteDomain,
  installSSLForDomain,
  checkNginxStatus
}; 
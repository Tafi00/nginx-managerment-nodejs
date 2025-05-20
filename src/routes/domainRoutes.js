const express = require('express');
const domainController = require('../controllers/domainController');

const router = express.Router();

/**
 * @swagger
 * /domains:
 *   get:
 *     summary: Lấy danh sách tất cả domain
 *     tags: [Domains]
 *     responses:
 *       200:
 *         description: Danh sách tất cả domain
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Domain'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', domainController.getAllDomains);

/**
 * @swagger
 * /domains/{domain}:
 *   get:
 *     summary: Lấy chi tiết một domain
 *     tags: [Domains]
 *     parameters:
 *       - in: path
 *         name: domain
 *         schema:
 *           type: string
 *         required: true
 *         description: Tên domain cần lấy thông tin
 *     responses:
 *       200:
 *         description: Thông tin chi tiết của domain
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Domain'
 *       404:
 *         description: Không tìm thấy domain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:domain', domainController.getDomain);

/**
 * @swagger
 * /domains:
 *   post:
 *     summary: Tạo domain mới
 *     tags: [Domains]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *               - subfolder
 *             properties:
 *               domain:
 *                 type: string
 *                 description: Tên domain
 *                 example: example.com
 *               subfolder:
 *                 type: string
 *                 description: Tên subfolder
 *                 example: example
 *     responses:
 *       201:
 *         description: Domain được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Domain example.com được tạo thành công
 *                 data:
 *                   $ref: '#/components/schemas/Domain'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Domain đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', domainController.createDomain);

/**
 * @swagger
 * /domains/{domain}:
 *   put:
 *     summary: Cập nhật domain
 *     tags: [Domains]
 *     parameters:
 *       - in: path
 *         name: domain
 *         schema:
 *           type: string
 *         required: true
 *         description: Tên domain cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subfolder:
 *                 type: string
 *                 description: Tên subfolder mới
 *                 example: new-example
 *               enabled:
 *                 type: boolean
 *                 description: Trạng thái kích hoạt
 *                 example: true
 *     responses:
 *       200:
 *         description: Domain được cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Domain example.com được cập nhật thành công
 *                 data:
 *                   $ref: '#/components/schemas/Domain'
 *       404:
 *         description: Không tìm thấy domain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:domain', domainController.updateDomain);

/**
 * @swagger
 * /domains/{domain}:
 *   delete:
 *     summary: Xóa domain
 *     tags: [Domains]
 *     parameters:
 *       - in: path
 *         name: domain
 *         schema:
 *           type: string
 *         required: true
 *         description: Tên domain cần xóa
 *     responses:
 *       200:
 *         description: Domain được xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Domain example.com đã được xóa thành công
 *       404:
 *         description: Không tìm thấy domain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:domain', domainController.deleteDomain);

/**
 * @swagger
 * /domains/{domain}/ssl:
 *   post:
 *     summary: Cài đặt SSL cho domain
 *     tags: [Domains]
 *     parameters:
 *       - in: path
 *         name: domain
 *         schema:
 *           type: string
 *         required: true
 *         description: Tên domain cần cài SSL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email để đăng ký Let's Encrypt
 *                 example: admin@example.com
 *     responses:
 *       200:
 *         description: SSL được cài đặt thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: SSL đã được cài đặt cho domain example.com
 *                 data:
 *                   $ref: '#/components/schemas/Domain'
 *       404:
 *         description: Không tìm thấy domain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:domain/ssl', domainController.installSSLForDomain);

/**
 * @swagger
 * /domains/nginx/status:
 *   get:
 *     summary: Kiểm tra trạng thái Nginx
 *     tags: [Nginx]
 *     responses:
 *       200:
 *         description: Trạng thái Nginx
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [running, stopped]
 *                       example: running
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/nginx/status', domainController.checkNginxStatus);

module.exports = router; 
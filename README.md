# API Quản lý cấu hình Nginx

API Node.js để quản lý cấu hình Nginx, đặc biệt là gắn domain cho các subfolder của localhost:3000 và cài đặt HTTPS.

## Tính năng chính

- Tạo và quản lý domain mapping đến subfolder của localhost:3000
- Kích hoạt/vô hiệu hóa cấu hình domain
- Cài đặt SSL sử dụng Let's Encrypt
- Giám sát trạng thái Nginx

## Cài đặt

1. Clone dự án:
```
git clone https://github.com/yourusername/nginx-managerment-nodejs.git
cd nginx-managerment-nodejs
```

2. Cài đặt các gói phụ thuộc:
```
npm install
```

3. Tạo file `.env` từ file `.env.example`:
```
cp .env.example .env
```

4. Chỉnh sửa file `.env` với cấu hình phù hợp:
```
PORT=3001
LOG_LEVEL=info
NGINX_CONFIG_PATH=/etc/nginx/conf.d
NGINX_SITES_PATH=/etc/nginx/sites-available
NGINX_ENABLED_PATH=/etc/nginx/sites-enabled
NGINX_RELOAD_COMMAND=systemctl reload nginx
NGINX_STATUS_COMMAND=systemctl status nginx
DEFAULT_SERVER_PORT=3000
SSL_CERTIFICATES_PATH=/etc/letsencrypt/live
DOMAIN_PREFIX=localhost
```

5. Khởi động ứng dụng:
```
npm start
```

Để phát triển:
```
npm run dev
```

## API Endpoints

### Domain API

| Phương thức | Đường dẫn | Mô tả |
|-------------|-----------|-------|
| GET | /api/domains | Lấy danh sách tất cả domain |
| GET | /api/domains/:domain | Lấy chi tiết một domain |
| POST | /api/domains | Tạo domain mới |
| PUT | /api/domains/:domain | Cập nhật domain |
| DELETE | /api/domains/:domain | Xóa domain |
| POST | /api/domains/:domain/ssl | Cài đặt SSL cho domain |
| GET | /api/domains/nginx/status | Kiểm tra trạng thái Nginx |

### Ví dụ tạo domain mới

```bash
curl -X POST http://localhost:3001/api/domains \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "subfolder": "example"
  }'
```

### Ví dụ cài đặt SSL

```bash
curl -X POST http://localhost:3001/api/domains/example.com/ssl \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com"
  }'
```

## Yêu cầu hệ thống

- Node.js (>= 12.x)
- Nginx đã được cài đặt
- Quyền truy cập vào file cấu hình Nginx
- Certbot (để cài đặt Let's Encrypt SSL)

## Giấy phép

ISC 
# API Quản lý cấu hình Nginx

API Node.js để quản lý cấu hình Nginx, đặc biệt là gắn domain cho các subfolder của localhost:3000 và cài đặt HTTPS.

## Tính năng chính

- Tạo và quản lý domain mapping đến subfolder của localhost:3000
- Kích hoạt/vô hiệu hóa cấu hình domain
- Cài đặt SSL sử dụng Let's Encrypt (Certbot) với auto-renewal
- Giám sát trạng thái Nginx
- Hỗ trợ Next.js với cấu hình cho assets tĩnh
- API documentation với Swagger/OpenAPI
- Bảo mật API bằng token xác thực

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
ADMIN_TOKEN=your_secure_token_here
```

5. Khởi động ứng dụng:
```
npm start
```

Để phát triển:
```
npm run dev
```

## Xác thực API

API này sử dụng xác thực token để bảo vệ các endpoints. Token được cấu hình trong biến môi trường `ADMIN_TOKEN`.

Có hai cách để cung cấp token:

1. **Authorization Header**: Sử dụng header Authorization với cú pháp Bearer Token
   ```
   Authorization: Bearer your_token_here
   ```

2. **Query Parameter**: Thêm query parameter `token` vào URL
   ```
   http://localhost:3001/api/domains?token=your_token_here
   ```

Tất cả các API endpoints ngoại trừ root endpoint (`/api`) đều yêu cầu xác thực token.

## API Documentation

API documentation được tạo tự động sử dụng Swagger/OpenAPI.

- Để xem API documentation trực tiếp trên trình duyệt, truy cập:
  ```
  http://localhost:3001/api-docs
  ```

- Để xuất API documentation ra file:
  ```
  npm run generate-docs
  ```
  Điều này sẽ tạo ra các file trong thư mục `docs/`:
  - `swagger.json`: Swagger specification dạng JSON
  - `index.html`: Tệp HTML tĩnh chứa Swagger UI

## API Endpoints

### Domain API

| Phương thức | Đường dẫn | Mô tả |
|-------------|-----------|-------|
| GET | /api/domains | Lấy danh sách tất cả domain |
| GET | /api/domains/:domain | Lấy chi tiết một domain |
| POST | /api/domains | Tạo domain mới hoặc cập nhật nếu đã tồn tại |
| PUT | /api/domains/:domain | Cập nhật domain |
| DELETE | /api/domains/:domain | Xóa domain |
| POST | /api/domains/:domain/ssl | Cài đặt hoặc cập nhật SSL cho domain (với auto-renewal) |
| GET | /api/domains/nginx/status | Kiểm tra trạng thái Nginx |

### Ví dụ tạo domain mới

```bash
curl -X POST http://localhost:3001/api/domains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "domain": "example.com",
    "subfolder": "example"
  }'
```

### Ví dụ cài đặt SSL

```bash
curl -X POST http://localhost:3001/api/domains/example.com/ssl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "email": "admin@example.com"
  }'
```

## Chức năng đặc biệt

### Tạo/cập nhật domain
Khi gọi API tạo domain, nếu domain đã tồn tại, hệ thống sẽ tự động cập nhật cấu hình cho domain đó thay vì báo lỗi. Điều này giúp đơn giản hóa quy trình quản lý và tránh lỗi trùng lặp.

### SSL với auto-renewal
Khi cài đặt SSL, hệ thống sẽ:
- Tự động cài đặt SSL với Let's Encrypt
- Thiết lập auto-renewal (2 lần mỗi ngày)
- Tự động chuyển hướng HTTP sang HTTPS
- Giữ lại chứng chỉ hiện có nếu chưa hết hạn
- Cập nhật chứng chỉ nếu đã tồn tại

## Mô tả Cấu hình Nginx

API tạo cấu hình Nginx với các đặc điểm sau:

1. **Proxy các asset tĩnh của Next.js**
   ```nginx
   location ~ ^/_next/ {
       proxy_pass http://localhost:3000$request_uri;
       proxy_set_header Host localhost:3000;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_ssl_server_name on;
   }
   ```

2. **Proxy các file tĩnh trong thư mục /static/ hoặc /public/**
   ```nginx
   location ~ ^/(static|public)/ {
       proxy_pass http://localhost:3000$request_uri;
       proxy_set_header Host localhost:3000;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_ssl_server_name on;
   }
   ```

3. **Proxy trang chính và sửa đường dẫn tương đối**
   ```nginx
   location / {
       proxy_pass http://localhost:3000/subfolder;
       proxy_set_header Host localhost:3000;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_ssl_server_name on;

       # sửa các đường dẫn tương đối thành đường dẫn gốc
       sub_filter_once off;
       sub_filter 'href="/' 'href="http://localhost:3000/';
       sub_filter 'src="/'  'src="http://localhost:3000/';
       sub_filter 'action="/'   'action="http://localhost:3000/';
       sub_filter 'content="/'  'content="http://localhost:3000/';
   }
   ```

4. **SSL được cấu hình tự động bởi Certbot với auto-renewal**
   SSL được cài đặt thông qua Certbot với các tùy chọn:
   ```bash
   certbot --nginx -d domain.com --non-interactive --agree-tos --email user@example.com --redirect --keep-until-expiring --renew-by-default --no-eff-email
   ```
   
   Auto-renewal được thiết lập thông qua crontab:
   ```
   0 */12 * * * certbot renew --quiet
   ```

## Yêu cầu hệ thống

- Node.js (>= 12.x)
- Nginx đã được cài đặt
- Quyền truy cập vào file cấu hình Nginx
- Certbot (để cài đặt Let's Encrypt SSL)
- Cron (để thiết lập auto-renewal)

## Giấy phép

ISC 
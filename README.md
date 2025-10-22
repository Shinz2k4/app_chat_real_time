# Chat App - Microservices Architecture

Một ứng dụng chat realtime được xây dựng theo kiến trúc microservice sử dụng Express + Node.js + Socket.io + MongoDB Atlas.

## 🏗️ Kiến trúc hệ thống

Hệ thống bao gồm 4 microservices chính:

### 1. Auth Service (Port 3001)
- Xử lý đăng ký, đăng nhập và xác thực người dùng
- Sử dụng JWT để quản lý session
- Mã hóa mật khẩu bằng bcrypt

**API Endpoints:**
- `POST /auth/register` - Đăng ký tài khoản mới
- `POST /auth/login` - Đăng nhập
- `GET /auth/verify` - Xác thực token

### 2. User Service (Port 3002)
- Quản lý thông tin người dùng và danh sách bạn bè
- Xử lý lời mời kết bạn và quản lý mối quan hệ

**API Endpoints:**
- `GET /users/search?username=` - Tìm kiếm người dùng
- `POST /users/add-friend` - Gửi lời mời kết bạn
- `POST /users/accept-friend` - Chấp nhận lời mời kết bạn
- `GET /users/friends` - Lấy danh sách bạn bè
- `GET /users/friend-requests` - Lấy danh sách lời mời kết bạn

### 3. Chat Service (Port 3003)
- Xử lý chat realtime bằng Socket.io
- Lưu trữ tin nhắn trong MongoDB
- Chỉ cho phép chat giữa các bạn bè

**API Endpoints:**
- `GET /chat/history/:friendUsername` - Lấy lịch sử chat
- `PUT /chat/mark-read/:friendUsername` - Đánh dấu tin nhắn đã đọc
- `GET /chat/unread-count` - Lấy số tin nhắn chưa đọc

**Socket Events:**
- `send_message` - Gửi tin nhắn
- `new_message` - Nhận tin nhắn mới
- `typing` - Thông báo đang gõ
- `user_typing` - Nhận thông báo đang gõ
- `join_chat` - Tham gia phòng chat
- `leave_chat` - Rời phòng chat

### 4. Frontend Service (Port 3000)
- Giao diện người dùng hoàn chỉnh với HTML/CSS/JavaScript
- Tích hợp với tất cả các backend services
- Hỗ trợ đăng ký, đăng nhập, quản lý bạn bè và chat realtime
- Responsive design cho mobile và desktop

**Tính năng:**
- Đăng ký và đăng nhập người dùng
- Tìm kiếm và thêm bạn bè
- Chat realtime với Socket.io
- Lịch sử tin nhắn
- Giao diện thân thiện và hiện đại

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Docker và Docker Compose
- MongoDB Atlas account (hoặc MongoDB local)

### 1. Clone repository
```bash
git clone <repository-url>
cd app_chat_realtime
```

### 2. Cấu hình môi trường
Tạo file `.env` từ file `env.example`:
```bash
cp env.example .env
```

Chỉnh sửa file `.env`:
```env
# MongoDB Atlas Connection String
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app?retryWrites=true&w=majority

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-here
```

### 3. Chạy ứng dụng
```bash
# Build và chạy tất cả services
docker compose up --build

# Chạy ở background
docker compose up -d --build
```

### 4. Kiểm tra services
- Frontend Service: http://localhost:3000 (Giao diện chính)
- Auth Service: http://localhost:3001/health
- User Service: http://localhost:3002/health
- Chat Service: http://localhost:3003/health

## 📝 Hướng dẫn sử dụng

### Cách sử dụng đơn giản nhất:
1. Mở trình duyệt và truy cập: **http://localhost:3000**
2. Đăng ký tài khoản mới hoặc đăng nhập
3. Tìm kiếm và thêm bạn bè
4. Bắt đầu chat realtime!

### Sử dụng API trực tiếp:

### 1. Đăng ký tài khoản
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "password123"}'
```

### 2. Đăng nhập
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "password123"}'
```

### 3. Tìm kiếm người dùng
```bash
curl -X GET "http://localhost:3002/users/search?username=bob" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Gửi lời mời kết bạn
```bash
curl -X POST http://localhost:3002/users/add-friend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"username": "bob"}'
```

### 5. Chấp nhận lời mời kết bạn
```bash
curl -X POST http://localhost:3002/users/accept-friend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"username": "alice"}'
```

### 6. Kết nối Socket.io
```javascript
const socket = io('http://localhost:3003', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Gửi tin nhắn
socket.emit('send_message', {
  receiver: 'bob',
  message: 'Hello Bob!'
});

// Lắng nghe tin nhắn mới
socket.on('new_message', (data) => {
  console.log('New message:', data);
});
```

## 🧪 Testing với Postman

### Collection Postman
Tạo collection Postman với các request sau:

1. **Register User**
   - Method: POST
   - URL: http://localhost:3001/auth/register
   - Body: `{"username": "alice", "password": "password123"}`

2. **Login User**
   - Method: POST
   - URL: http://localhost:3001/auth/login
   - Body: `{"username": "alice", "password": "password123"}`

3. **Search Users**
   - Method: GET
   - URL: http://localhost:3002/users/search?username=bob
   - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

4. **Add Friend**
   - Method: POST
   - URL: http://localhost:3002/users/add-friend
   - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
   - Body: `{"username": "bob"}`

5. **Accept Friend**
   - Method: POST
   - URL: http://localhost:3002/users/accept-friend
   - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
   - Body: `{"username": "alice"}`

6. **Get Chat History**
   - Method: GET
   - URL: http://localhost:3003/chat/history/bob
   - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

## 🐳 Docker Commands

```bash
# Xem logs của tất cả services
docker compose logs

# Xem logs của service cụ thể
docker compose logs auth-service
docker compose logs user-service
docker compose logs chat-service

# Dừng tất cả services
docker compose down

# Dừng và xóa volumes
docker compose down -v

# Rebuild service cụ thể
docker compose up --build auth-service
```

## 📁 Cấu trúc thư mục

```
chat-app/
├── docker-compose.yml
├── env.example
├── README.md
├── auth-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── models/
│   │   └── User.js
│   └── routes/
│       └── auth.js
├── user-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── users.js
│   └── middleware/
│       └── auth.js
└── chat-service/
    ├── Dockerfile
    ├── package.json
    ├── server.js
    ├── models/
    │   └── Message.js
    ├── routes/
    │   └── chat.js
    ├── middleware/
    │   └── auth.js
    └── socket/
        └── chatHandler.js
```

## 🔧 Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra MONGO_URI trong file .env
- Đảm bảo MongoDB Atlas cluster đang chạy
- Kiểm tra IP whitelist trong MongoDB Atlas

### Lỗi kết nối giữa services
- Kiểm tra network trong docker-compose.yml
- Đảm bảo tất cả services đã khởi động
- Kiểm tra logs của từng service

### Lỗi Socket.io
- Kiểm tra CORS settings
- Đảm bảo JWT token hợp lệ
- Kiểm tra authentication middleware

## 📄 License

MIT License

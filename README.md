# Pixel Quest

Top-down pixel action RPG — Phaser 3 trên Next.js 15 với tài khoản, lưu game trên đám mây (Turso / libSQL), và bảng xếp hạng.

## Chạy local

1. `npm install`
2. Copy `.env.example` → `.env.local` (giá trị mặc định OK để chạy local)
3. `npm run dev` → http://localhost:3000

Local dùng SQLite file `./data/dev.db` — không cần tài khoản Turso.

## Test / lint / build

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Hướng dẫn chơi

| Phím | Hành động |
|------|-----------|
| W/A/S/D hoặc mũi tên | Di chuyển |
| SPACE | Chém kiếm |
| E | Tương tác (NPC / hòm / cổng) |
| 1 | Uống bình máu |
| S | Lưu game (tự động lưu mỗi 15s và khi đổi map) |

Mục tiêu: diệt SLIME rồi làm quest của Bác Trưởng Làng rồi qua Rừng, Hang để hạ Boss ở Đấu Trường để chiến thắng. Điểm = xu + 1000 nếu hạ Boss.

## Deploy lên Vercel (tự làm, không dùng vercel CLI)

1. Tạo database trên **Turso**: https://turso.tech — lệnh:
   ```bash
   turso db create pixelquest
   turso db tokens create pixelquest   # lấy token
   ```
2. Đẩy repo lên GitHub/GitLab.
3. Trên https://vercel.com: **Add New Project** → Import repo này.
4. Cấu hình **Environment Variables**:
   - `DATABASE_URL=libsql://pixelquest-xxx.turso.io` (URL từ bước 1)
   - `DATABASE_URL` cũng có thể kèm `?authToken=...` hoặc dùng
   - `JWT_SECRET=<chuỗi ngẫu nhiên dài>` (vd `openssl rand -hex 32`)
5. Bấm **Deploy**. Xong!
6. Sau deploy, ghé thăm `/api/save` để lần đầu khởi tạo bảng (tự động qua schema).

Lưu ý: không đưa token/auth vào env layer trong client — Turso token chỉ nằm ở server (Next.js API routes), nơi biến môi trường là an toàn.
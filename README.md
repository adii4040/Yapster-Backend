# Yapster Backend

Backend API and real-time service for the Yapster chat application.

## Overview

Yapster Backend is a Node.js + Express server with:
- User authentication and profile management
- Email verification and password reset flows
- 1:1 messaging APIs
- Real-time online user presence and incoming message events using Socket.IO
- Media upload support (avatar and message attachments) with Cloudinary storage

## Tech Stack

- Runtime: Node.js (ES modules)
- Framework: Express
- Database: MongoDB (Mongoose)
- Real-time: Socket.IO
- Auth: JWT + cookie-based session tokens
- Validation: Zod
- File Uploads: Multer
- Media Hosting: Cloudinary
- Email Service: Resend + Mailgen

## Project Structure

```text
src/
  app.js                      # Express app, CORS, middleware, route mounting, global error handler
  index.js                    # App bootstrap, DB connect, HTTP server start
  socket.js                   # Socket.IO server setup and online user tracking
  Controllers/
  DB/
  Middlewares/
  Models/
  Routes/
  Validators/
  utils/
public/
  avatar/                     # Temporary avatar files before cloud upload/deletion
  temp/                       # Temporary message attachments before cloud upload/deletion
```

## API Base URL

By default:

```text
http://localhost:8080/api/v1
```

## Authentication Model

- Login sets two cookies:
  - `accessToken`
  - `refreshToken`
- Cookie options are:
  - `httpOnly: true`
  - `secure: true`
  - `sameSite: 'None'`
- Protected routes require `verifyJWT` middleware.
- JWT can also be provided using `Authorization: Bearer <token>`.

## Main API Endpoints

### Health

- `GET /healthcheck/`
  - Returns server status.

### User

- `POST /user/register`
  - Multipart form-data
  - Fields:
    - `fullname` (required)
    - `email` (required)
    - `password` (required)
    - `avatar` (required file, image only)

- `POST /user/login`
  - JSON body:
    - `email`
    - `password`

- `GET /user/:id/verify-email/:emailVerificationToken`
  - Verifies account email.

- `POST /user/request-forgot-password`
  - JSON body:
    - `email`

- `PUT /user/:forgotPasswordToken/reset-forgot-password`
  - JSON body:
    - `password`
    - `confirmPassword`

Protected user endpoints:

- `POST /user/logout`
- `GET /user/current-user`
- `GET /user/all-users`
- `POST /user/resend-email-verification`
- `PUT /user/:id/reset-password`
  - JSON body:
    - `password`
    - `confirmPassword`
- `PUT /user/:id/update`
  - Multipart form-data
  - Optional fields:
    - `fullname`
    - `email`
    - `avatar` (image)

### Message

Protected message endpoints:

- `POST /message/:receiverId/send`
  - Multipart form-data
  - Optional text field:
    - `text`
  - Optional attachment fields (one each max):
    - `sharedImg` (image/*)
    - `sharedVideos` (video/*)
    - `sharedFiles` (application/*)

- `GET /message/:receiverId/get-message`
  - Fetches conversation between logged-in user and receiver.

## Validation Rules

Zod validation is used for user payloads.

- Email must be valid format.
- Password rules:
  - 8 to 12 chars
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- Reset password requires `confirmPassword` to match `password`.

## Real-time (Socket.IO)

Socket server runs on the same HTTP server used by Express.

### Connection

Client should connect with query:

```text
userId=<loggedInUserId>
```

### Server events

- `getOnlineUsers`
  - Emitted to all clients when user connects/disconnects.
  - Payload: list of online user IDs.

- `newMessage`
  - Emitted to message receiver when they are online.
  - Payload: created message document (with sender and receiver populated).

## Environment Variables

Create a `.env` file in project root:

```env
PORT=8080
NODE_ENV=development

MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>/<db>

ACCESS_TOKEN_SECRET_KEY=your_access_secret
REFRESH_TOKEN_SECRET_KEY=your_refresh_secret

BASE_CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Yapster <onboarding@resend.dev>
```

## Installation and Run

1. Install dependencies:

```bash
npm install
```

2. Start in development mode:

```bash
npm run dev
```

3. Start in production mode:

```bash
npm start
```

## Deployment

This backend can be deployed on any Node.js host that supports long-running HTTP services and WebSocket connections.

### Pre-deployment checklist

- Set all required environment variables from the Environment Variables section.
- Use a production MongoDB connection string in `MONGODB_URL`.
- Set `BASE_CLIENT_URL` to your deployed frontend URL.
- Ensure frontend requests include credentials when using cookie auth.
- Confirm your host supports WebSockets (required for Socket.IO).
- Use HTTPS in production (required for secure cookies).

### Minimum production environment values

```env
NODE_ENV=production
PORT=8080
BASE_CLIENT_URL=https://your-frontend-domain.com
MONGODB_URL=your_production_mongodb_connection_string
ACCESS_TOKEN_SECRET_KEY=strong_random_secret
REFRESH_TOKEN_SECRET_KEY=strong_random_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=Yapster <no-reply@your-domain.com>
```

### Deploy on Render

1. Create a new Web Service and connect this repository.
2. Runtime: Node.
3. Build command:

```bash
npm install
```

4. Start command:

```bash
npm start
```

5. Add all environment variables in Render dashboard.
6. Enable auto-deploy if desired.
7. Update frontend `.env` to point API and socket URL to your Render service URL.

### Deploy on Railway

1. Create a new project and link the repository.
2. Railway auto-detects Node app from `package.json`.
3. Set all environment variables in project variables.
4. Use start command:

```bash
npm start
```

5. Deploy and copy the generated public domain.
6. Set frontend API base URL and socket URL to Railway domain.

### Deploy on a VPS (Ubuntu + PM2 + Nginx)

1. Install Node.js LTS and Git.
2. Clone repository and install dependencies:

```bash
npm install --production
```

3. Create `.env` with production values.
4. Install PM2 and run service:

```bash
npm install -g pm2
pm2 start src/index.js --name yapster-backend
pm2 save
pm2 startup
```

5. Configure Nginx reverse proxy to your app port.
6. Use Certbot for HTTPS certificates.
7. Restart and verify WebSocket upgrades through Nginx.

### Post-deployment verification

- Check `GET /api/v1/healthcheck/` returns 200.
- Test registration with avatar upload.
- Test login and ensure auth cookies are set.
- Test email verification and forgot-password flow.
- Test real-time message delivery between two users.
- Verify CORS allows only expected origins.

## CORS Configuration

Allowed origins include:
- `http://localhost:5173`
- `https://yapster-frontend.vercel.app`
- `BASE_CLIENT_URL` from environment

Trailing slashes are normalized before origin checks.

## Response and Error Format

### Success response shape

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "success": true
}
```

### Error response shape

```json
{
  "statusCode": 400,
  "success": false,
  "message": "Error message",
  "errors": [],
  "data": null,
  "stack": "only in development"
}
```

## Notes

- Uploaded files are saved to local temp folders first and then uploaded to Cloudinary.
- Local temp files are removed after Cloudinary upload attempt.
- Since auth cookies are `secure: true`, use HTTPS or adjust cookie settings for local-only testing if needed.

## Scripts

- `npm run dev` -> Run server with nodemon
- `npm start` -> Run server with node

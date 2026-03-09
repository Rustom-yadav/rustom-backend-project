# Rustom's Backend Project

A production-ready **Node.js / Express** REST API for a video-platform backend — users, videos, comments, likes, playlists, subscriptions, and watch history.

---

## 🔗 Live & Repository

| | Link |
|---|------|
| **🌐 Live** | [Go to Live](https://rustom-backend-project.onrender.com) |
| **📂 GitHub** | [https://github.com/Rustom-yadav/rustom-backend-project] |

---

## ✨ Features

- **Users** — Register, login, logout, JWT (access + refresh), change password, update profile, avatar & cover image (Cloudinary), channel profile, watch history
- **Videos** — Upload (video + thumbnail), get by ID, list all (paginated), update/delete (owner-only), list by owner, add to watch history
- **Comments** — Add, update, delete (owner-only), get comments by video (paginated)
- **Likes** — Toggle like on video, toggle like on comment
- **Playlists** — CRUD, add/remove videos (owner-only), get by ID with paginated videos
- **Subscriptions** — Subscribe/unsubscribe to channel, list subscribed channels, list channel subscribers
- **Auth** — Cookie + Bearer token, `verifyJwt` middleware on protected routes

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB (Mongoose) |
| Auth | JWT (access + refresh), cookies |
| File storage | Cloudinary (video, thumbnail, avatar, cover) |
| Upload | Multer (local temp → Cloudinary) |
| Pagination | mongoose-aggregate-paginate-v2, skip/limit |

---

## 📁 Project Structure

```
src/
├── constants.js          # DB name etc.
├── index.js              # Entry: DB connect + start server
├── app.js                # Express app, CORS, routes
├── db/
│   └── index.js          # MongoDB connection
├── middlewares/
│   ├── auth.middlewares.js   # JWT verify
│   └── multer.middlewares.js # File upload (diskStorage)
├── models/
│   ├── user.model.js
│   ├── video.model.js
│   ├── comment.model.js
│   ├── like.model.js
│   ├── playlist.model.js
│   └── subscription.model.js
├── controllers/
│   ├── user.controller.js
│   ├── video.controller.js
│   ├── comment.controller.js
│   ├── like.controller.js
│   ├── playlist.controller.js
│   └── subscription.controller.js
├── routes/
│   ├── user.routes.js
│   ├── video.routes.js
│   ├── comment.routes.js
│   ├── like.routes.js
│   ├── playlist.routes.js
│   └── subscription.routes.js
└── utils/
    ├── ApiResponse.js    # Standard success response
    ├── ApiErrors.js      # Custom error class
    ├── asyncHandler.js   # Async route wrapper
    └── cloudinary.js     # Upload helpers
```

---

## 📋 Prerequisites

- **Node.js** (v18+ recommended)
- **MongoDB** ( Atlas Cloud)
- **Cloudinary** account (for video, image uploads)

---

## 🚀 Installation

```bash

git clone (https://github.com/Rustom-yadav/rustom-backend-project.git)
cd Rustom's-backend-project

# Install dependencies
npm install
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (see `.gitignore` — `.env` is not committed).

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 8000) | No |
| `MONGO_URI` | MongoDB connection string | Yes |
| `CORS_ORIGIN` | Allowed frontend origin (e.g. `https://yourapp.com`) | No |
| `ACCESS_TOKEN_SECRET` | JWT access token secret | Yes |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret | Yes |
| `ACCESS_TOKEN_EXPIRES` | Access token expiry (e.g. `1d`) | Yes |
| `REFRESH_TOKEN_EXPIRES` | Refresh token expiry (e.g. `10d`) | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |

**Example `.env`:**
```env
PORT=8000
MONGO_URI=mongodb://localhost:27017
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRES=1d
REFRESH_TOKEN_EXPIRES=10d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## ▶️ Running the App

```bash
# Development (nodemon)
npm run dev
```

Server runs at `http://localhost:8000` (or your `PORT`). Base path for all APIs: **`/api/v1`**.

---

## 📡 API Overview

### Base URL
`/api/v1`

### Users — `/api/v1/users`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register (avatar, coverImage multipart) |
| POST | `/login` | No | Login |
| POST | `/logout` | Yes | Logout (clear cookies) |
| POST | `/refresh-token` | No | Refresh access token |
| POST | `/change-password` | Yes | Change password |
| GET | `/get-current-user` | Yes | Current user |
| PATCH | `/update-profile` | Yes | Update profile |
| PATCH | `/update-avatar` | Yes | Update avatar (single file) |
| PATCH | `/update-cover-image` | Yes | Update cover image |
| GET | `/c/:username` | Yes | Channel profile by username |
| GET | `/watch-history` | Yes | User watch history |

### Videos — `/api/v1/videos`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | All videos (paginated, `?page`, `?limit`) |
| GET | `/:videoId` | No | Video by ID |
| GET | `/by-owner/:ownerId` | No | Videos by owner (paginated) |
| POST | `/upload` | Yes | Upload video + thumbnail (multipart) |
| PATCH | `/:videoId` | Yes | Update video (owner only) |
| DELETE | `/:videoId` | Yes | Delete video (owner only) |
| POST | `/watch-history/:videoId` | Yes | Add video to watch history |

### Comments — `/api/v1/comments`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/video/:videoId` | No | Comments for video (paginated) |
| POST | `/video/:videoId/add` | Yes | Add comment |
| PATCH | `/:commentId` | Yes | Update comment (owner only) |
| DELETE | `/:commentId` | Yes | Delete comment (owner only) |

### Likes — `/api/v1/likes`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/video/:videoId` | Yes | Toggle like on video |
| POST | `/comment/:commentId` | Yes | Toggle like on comment |

### Playlists — `/api/v1/playlists`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Current user's playlists |
| GET | `/:playlistId` | No | Playlist by ID (videos paginated) |
| POST | `/` | Yes | Create playlist |
| PATCH | `/:playlistId` | Yes | Update playlist (owner only) |
| DELETE | `/:playlistId` | Yes | Delete playlist (owner only) |
| POST | `/:playlistId/video/:videoId` | Yes | Add video to playlist |
| DELETE | `/:playlistId/video/:videoId` | Yes | Remove video from playlist |

### Subscriptions — `/api/v1/subscriptions`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/subscribe/:channelId` | Yes | Subscribe to channel |
| POST | `/unsubscribe/:channelId` | Yes | Unsubscribe |
| GET | `/subscribed` | Yes | Channels user is subscribed to |
| GET | `/channel/:channelId/subscribers` | No | Subscribers of a channel |

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon |

---

## 📄 License

ISC License — see [LICENSE](LICENSE).

---

## 👤 Author

**Rustom**

# 📝 SyncWrite

A full-stack, real-time collaborative document editor — think Google Docs, built from scratch.

Multiple users can edit the same document simultaneously, see live changes, leave comments, manage versions, and share documents with role-based access control.

![Tech Stack](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js) ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb) ![Yjs](https://img.shields.io/badge/Yjs-CRDT-orange) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- 🔄 **Real-time Collaboration** — Multiple users can edit the same document simultaneously using [Yjs](https://yjs.dev/) CRDT and WebSockets
- 👥 **Role-based Sharing** — Share documents with others as **Editor** or **Viewer**
- 🕓 **Version History** — Save named snapshots of your document and restore them anytime
- 💬 **Comments** — Leave inline comments on documents
- 🔔 **Notifications** — Get notified when someone shares a document with you
- 🔐 **Authentication** — JWT-based auth with Google OAuth support
- 📄 **Rich Text Editing** — Powered by the Quill editor
- 🌙 **Dark Mode** — Sleek dark UI by default
- 📤 **Export** — Export documents to PDF

---

## 🛠️ Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 19, Vite, React Router DOM        |
| Editor     | Quill, react-quill                      |
| Real-time  | Yjs, y-websocket, Socket.io             |
| Backend    | Node.js, Express 5                      |
| Database   | MongoDB, Mongoose                       |
| Auth       | JWT (jsonwebtoken), Google OAuth 2.0    |
| Security   | bcrypt, CORS                            |

---

## 📁 Project Structure

```
Collaborative-Document/
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── context/      # Auth context
│   │   ├── pages/        # Login, Register, Dashboard, Editor, Profile
│   │   └── services/     # Axios API service
│   └── .env              # Frontend environment variables
│
└── server/               # Node.js backend (Express)
    ├── middleware/        # JWT auth middleware
    ├── models/            # Mongoose models (User, Document, Comment, Notification)
    ├── routes/            # API routes (auth, documents, comments, notifications)
    └── .env              # Backend environment variables
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- A [Google Cloud](https://console.cloud.google.com/) project with OAuth 2.0 credentials

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/syncwrite.git
cd syncwrite
```

---

### 2. Set Up the Server

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/syncwrite
JWT_SECRET=your_strong_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

> **Note:** Replace `your_strong_jwt_secret_here` with a long random string and `your_google_oauth_client_id_here` with your Google OAuth Client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

Start the server:

```bash
npm run dev
```

The server will run on **http://localhost:5000**

---

### 3. Set Up the Client

```bash
cd ../client
npm install
```

Create a `.env` file inside the `client/` directory:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

Start the client:

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or use an existing one)
3. Click **Create Credentials → OAuth 2.0 Client ID**
4. Set the application type to **Web application**
5. Add `http://localhost:5173` to **Authorized JavaScript Origins**
6. Copy the **Client ID** and paste it into both `.env` files

---

## 🔌 API Overview

| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| POST   | `/api/auth/register`              | Register a new user            |
| POST   | `/api/auth/login`                 | Login with email & password    |
| POST   | `/api/auth/google`                | Login with Google OAuth        |
| GET    | `/api/documents`                  | Get all user documents         |
| POST   | `/api/documents`                  | Create a new document          |
| GET    | `/api/documents/:id`              | Get a single document          |
| PUT    | `/api/documents/:id`              | Update document content        |
| DELETE | `/api/documents/:id`              | Delete a document              |
| POST   | `/api/documents/:id/share`        | Share document with a user     |
| DELETE | `/api/documents/:id/share/:userId`| Remove a collaborator          |
| POST   | `/api/documents/:id/versions`     | Save a document version        |
| DELETE | `/api/documents/:id/versions/:vid`| Delete a document version      |
| GET    | `/api/comments/:docId`            | Get comments for a document    |
| POST   | `/api/comments`                   | Add a comment                  |
| GET    | `/api/notifications`              | Get user notifications         |

---

## 🌐 Real-time Architecture

Real-time collaboration is powered by **Yjs** — a conflict-free replicated data type (CRDT) library.

```
Client A ──┐
           ├──► WebSocket Server (y-websocket) ──► Yjs Document (shared state)
Client B ──┘
```

The WebSocket server is embedded in the Express server and listens for upgrades on the `/yjs/:docId` path.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [Yjs](https://yjs.dev/) for the CRDT real-time sync engine
- [Quill](https://quilljs.com/) for the rich text editor
- [Socket.io](https://socket.io/) for WebSocket management

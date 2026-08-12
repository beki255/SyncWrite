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
git clone https://github.com/beki255/SyncWrite.git
cd SyncWrite
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

## 🔌 API Documentation

> All protected routes require a `Bearer` token in the `Authorization` header:
> ```
> Authorization: Bearer <your_jwt_token>
> ```

---

### 🔐 Auth — `/api/auth`

#### `POST /api/auth/register`
Register a new user with email and password.

**Request Body:**
```json
{ "name": "Beki", "email": "beki@example.com", "password": "secret123" }
```
**Response:** `201`
```json
{ "user": { "id": "...", "name": "Beki", "email": "beki@example.com" }, "token": "<jwt>" }
```

---

#### `POST /api/auth/login`
Login with email and password.

**Request Body:**
```json
{ "email": "beki@example.com", "password": "secret123" }
```
**Response:** `200`
```json
{ "user": { "id": "...", "name": "Beki", "email": "beki@example.com" }, "token": "<jwt>" }
```

---

#### `POST /api/auth/google`
Login or register using a Google OAuth ID token.

**Request Body:**
```json
{ "token": "<google_id_token>" }
```
**Response:** `200` — same as login response.

---

#### `GET /api/auth/me` 🔒
Get the currently authenticated user's profile.

**Response:** `200`
```json
{ "user": { "id": "...", "name": "Beki", "email": "beki@example.com" } }
```

---

#### `PUT /api/auth/me/profile` 🔒
Update the authenticated user's display name.

**Request Body:**
```json
{ "name": "New Name" }
```

---

#### `PUT /api/auth/me/password` 🔒
Change the authenticated user's password.

**Request Body:**
```json
{ "currentPassword": "old_pass", "newPassword": "new_pass" }
```

---

### 📄 Documents — `/api/documents`

#### `GET /api/documents` 🔒
Get all documents owned by or shared with the authenticated user.

**Response:** Array of document objects, sorted by `updatedAt` descending.

---

#### `POST /api/documents` 🔒
Create a new document.

**Request Body:**
```json
{ "title": "My New Doc" }
```
**Response:** `201` — the created document object.

---

#### `GET /api/documents/:id` 🔒
Get a single document by ID. Requires owner or collaborator access.

---

#### `PUT /api/documents/:id` 🔒
Update document title or content. Requires **Editor** role or ownership.

**Request Body:**
```json
{ "title": "Updated Title", "data": { } }
```

---

#### `DELETE /api/documents/:id` 🔒
Delete a document. **Owner only.**

---

#### `POST /api/documents/:id/share` 🔒
Share a document with another user by email. **Owner only.**

**Request Body:**
```json
{ "email": "friend@example.com", "role": "Editor" }
```
> `role` can be `"Editor"`, `"Commenter"`, or `"Viewer"`

---

#### `DELETE /api/documents/:id/share/:userId` 🔒
Remove a collaborator from a document. **Owner only.**

---

#### `POST /api/documents/:id/versions` 🔒
Save the current document state as a named version. Requires **Editor** role.

**Request Body:**
```json
{ "data": { } }
```

---

#### `DELETE /api/documents/:id/versions/:versionId` 🔒
Delete a saved version. Requires **Editor** role.

---

### 💬 Comments — `/api/comments`

#### `GET /api/comments/:documentId` 🔒
Get all comments for a document. Requires access to the document.

---

#### `POST /api/comments/:documentId` 🔒
Add a comment to a document. **Viewers cannot comment.**

**Request Body:**
```json
{ "text": "Great point here!" }
```

---

#### `POST /api/comments/:documentId/:commentId/reply` 🔒
Reply to an existing comment. **Viewers cannot reply.**

**Request Body:**
```json
{ "text": "I agree!" }
```

---

#### `PUT /api/comments/:documentId/:commentId/resolve` 🔒
Toggle a comment's resolved status. **Viewers cannot resolve.**

---

#### `DELETE /api/comments/:documentId/:commentId` 🔒
Delete a comment. Only the **comment author** or **document owner** can delete.

---

### 🔔 Notifications — `/api/notifications`

#### `GET /api/notifications` 🔒
Get all notifications for the authenticated user, sorted by newest first.

---

#### `PUT /api/notifications/:id/read` 🔒
Mark a single notification as read.

---

#### `PUT /api/notifications/read-all` 🔒
Mark all of the user's notifications as read.

---

## 🗄️ Database Schema

The app uses **MongoDB** with **Mongoose**. Below are the four collections and their fields.

---

### `users`

| Field       | Type     | Required | Notes                                  |
|-------------|----------|----------|----------------------------------------|
| `name`      | String   | ✅       |                                        |
| `email`     | String   | ✅       | Unique                                 |
| `password`  | String   | ❌       | Hashed with bcrypt. Optional for Google OAuth users |
| `googleId`  | String   | ❌       | Unique, sparse. Only for Google users  |
| `createdAt` | Date     | auto     | Mongoose timestamp                     |
| `updatedAt` | Date     | auto     | Mongoose timestamp                     |

---

### `documents`

| Field            | Type       | Required | Notes                                         |
|------------------|------------|----------|-----------------------------------------------|
| `title`          | String     | ✅       | Default: `'Untitled Document'`                |
| `owner`          | ObjectId   | ✅       | Ref → `User`                                  |
| `data`           | Object     | ❌       | Stores Yjs document state                     |
| `collaborators`  | Array      | ❌       | List of `{ user: ObjectId, role: String }`    |
| `collaborators.user` | ObjectId | —      | Ref → `User`                                  |
| `collaborators.role` | String | —       | Enum: `'Viewer'`, `'Commenter'`, `'Editor'`   |
| `versions`       | Array      | ❌       | List of saved snapshots                       |
| `versions.data`  | Object     | —        | Snapshot content                              |
| `versions.createdBy` | ObjectId | —     | Ref → `User`                                  |
| `versions.createdAt` | Date   | —        | Default: `Date.now`                           |
| `createdAt`      | Date       | auto     | Mongoose timestamp                            |
| `updatedAt`      | Date       | auto     | Mongoose timestamp                            |

---

### `comments`

| Field              | Type     | Required | Notes                              |
|--------------------|----------|----------|------------------------------------|n| `documentId`       | ObjectId | ✅       | Ref → `Document`                   |
| `text`             | String   | ✅       |                                    |
| `createdBy`        | ObjectId | ✅       | Ref → `User`                       |
| `resolved`         | Boolean  | ❌       | Default: `false`                   |
| `replies`          | Array    | ❌       | List of reply objects              |
| `replies.text`     | String   | ✅       |                                    |
| `replies.createdBy`| ObjectId | ✅       | Ref → `User`                       |
| `replies.createdAt`| Date     | —        | Default: `Date.now`                |
| `createdAt`        | Date     | auto     | Mongoose timestamp                 |
| `updatedAt`        | Date     | auto     | Mongoose timestamp                 |

---

### `notifications`

| Field       | Type     | Required | Notes                   |
|-------------|----------|----------|-------------------------|
| `recipient` | ObjectId | ✅       | Ref → `User`            |
| `sender`    | ObjectId | ✅       | Ref → `User`            |
| `document`  | ObjectId | ✅       | Ref → `Document`        |
| `message`   | String   | ✅       | Human-readable message  |
| `read`      | Boolean  | ❌       | Default: `false`        |
| `createdAt` | Date     | auto     | Mongoose timestamp      |
| `updatedAt` | Date     | auto     | Mongoose timestamp      |

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

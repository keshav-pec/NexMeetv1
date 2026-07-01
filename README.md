# NexMeet

NexMeet is a modern, real-time video conferencing application built with the MERN stack and powered by LiveKit for scalable WebRTC communication.

## 🚀 Features

- **User Authentication:** Secure signup and login using JWT (JSON Web Tokens) and bcrypt password hashing.
- **Real-Time Video & Audio:** High-quality, low-latency video meetings powered by LiveKit.
- **Meeting Management:** Users can instantly create new meetings, join existing ones via unique Meeting IDs, and optionally secure rooms with passcodes.
- **Responsive UI:** A sleek, modern user interface built with React, TailwindCSS, and Lucide icons.

## 🏗 Architecture & Tech Stack

NexMeet follows a decoupled client-server architecture.

### Frontend (`/frontend`)
The client application is a Single Page Application (SPA) built for performance and seamless real-time interactions.
- **Framework:** React 18 powered by Vite.
- **State Management:** Zustand for lightweight, global state management.
- **Routing:** React Router DOM for client-side navigation (Login, Register, Dashboard, MeetingRoom).
- **Styling:** TailwindCSS for rapid, utility-first UI styling.
- **WebRTC Client:** `@livekit/components-react` and `livekit-client` for handling camera, microphone, and video track rendering.

### Backend (`/backend`)
A RESTful API that handles user data, authentication, and orchestrates LiveKit room creation.
- **Runtime & Framework:** Node.js with Express.js.
- **Database:** MongoDB via Mongoose (Models: `User`, `Meeting`).
- **Security:** `express-rate-limit` for DDoS protection, `bcryptjs` for password hashing, and JWT for stateless session validation.
- **WebRTC Server-Side:** `livekit-server-sdk` is used securely on the backend to generate participant access tokens and manage the lifecycle of LiveKit rooms.

## 📂 Project Structure

```
NexMeetv1/
├── frontend/
│   ├── src/
│   │   ├── pages/         # React Views (Login, Register, Dashboard, MeetingRoom)
│   │   ├── api/           # Axios interceptors and LiveKit token fetchers
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
└── backend/
    ├── controllers/       # Business logic (auth, meeting, room)
    ├── models/            # Mongoose Schemas (User.js, Meeting.js)
    ├── routes/            # Express route definitions
    ├── middleware/        # JWT validation, error handling
    ├── index.js           # Server entry point (Port 8080)
    └── package.json
```

## 🛠 Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- LiveKit Server URL, API Key, and Secret Key

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file with the necessary secrets (MONGO_URI, JWT_SECRET, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET).
4. Run the development server: `npm run dev` (Starts on port 8080)

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env` file with `VITE_API_URL` pointing to the backend.
4. Run the development server: `npm run dev` (Starts on port 5173)

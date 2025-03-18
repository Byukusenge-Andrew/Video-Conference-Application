# Video Conference Application

A real-time video conferencing application built with React, Node.js, WebRTC, and Socket.IO. This application allows users to create and join video conference rooms, share their screen, chat with other participants, and more.

## Features

- **Real-time Video Conferencing**: Connect with multiple participants in high-quality video calls
- **Screen Sharing**: Share your screen with other participants
- **Text Chat**: Send and receive messages in real-time with other participants
- **User Authentication**: Secure login and registration system
- **Public and Private Rooms**: Create rooms that are either public or only visible to logged-in users
- **Room Management**: Automatic cleanup of inactive rooms
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- WebRTC
- Socket.IO Client
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Socket.IO
- Prisma ORM
- MySQL Database
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL database
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Byukusenge-Andrew/video-conference-app.git
   cd video-conference-app
   ```

2. Install dependencies for both client and server
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. Set up environment variables
   
   Create a `.env` file in the server directory with the following variables:
   ```
   PORT=5000
   DATABASE_URL="mysql://username:password@localhost:3306/video_conference"
   JWT_SECRET="your-secret-key"
   CLIENT_URL="http://localhost:3000"
   ```

4. Set up the database
   ```bash
   cd server
   npx prisma migrate dev
   ```

5. Start the development servers
   ```bash
   # Start the server
   cd server
   npm run dev
   
   # Start the client in a new terminal
   cd client
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Usage

### Creating an Account
1. Navigate to the registration page
2. Enter your name, email, and password
3. Click "Create Account"

### Creating a Room
1. Log in to your account
2. On the home page, enter a room name
3. Toggle the "Make room private" option if desired
4. Click "Create Room"

### Joining a Room
1. Log in to your account
2. On the home page, you'll see a list of available rooms
3. Click "Join" on the room you want to enter

### In a Conference
- Toggle your microphone and camera using the control buttons
- Share your screen by clicking the screen share button
- Open the chat panel by clicking the chat button
- Leave the room by clicking the hang up button

## Project Structure

# Project: Real-Time Chat-App

![Tech Stack](https://img.shields.io/badge/tech-Node.js%2C%20TypeScript%2C%20Redis%2C%20WebSockets-blue.svg)

A real-time chat application built from the ground up. This project serves as a practical exercise to deepen my understanding of modern backend architecture, real-time communication protocols, and efficient data management.

## Core Learning Objectives

The primary goal of this project is to gain hands-on experience with and solidify my understanding of the following technologies and concepts:

-   **Node.js:** Building a scalable, event-driven server with a non-blocking I/O model.
-   **TypeScript:** Leveraging static typing to build a robust, maintainable, and error-free backend codebase.
-   **WebSockets:** Implementing persistent, bidirectional communication channels between the client and server for a seamless, real-time chat experience.
-   **Redis:** Using Redis for multiple purposes:
    -   **Caching:** Caching frequently accessed data like user sessions or profiles to reduce database load.
    -   **Pub/Sub:** Implementing a message broker to handle message distribution across multiple server instances or rooms.
-   **Databases (SQL/NoSQL):** Designing a database schema, managing user data, and persisting chat history efficiently.

## Features (Planned)

-   [ ] User Authentication (Login/Registration)
-   [ ] Real-time one-on-one and group messaging
-   [ ] Multiple chat rooms/channels
-   [ ] Online/Offline user status indicators
-   [ ] Typing indicators
-   [ ] Message history loading
-   [ ] User search and profile viewing

## Tech Stack

### Backend

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Language:** TypeScript
-   **Real-time Communication:** WebSockets
-   **In-Memory Store:** Redis
-   **Database:** [Choose one: e.g., PostgreSQL, MongoDB]

### Frontend

-   **Framework:** 
    React

## Getting Started

### Prerequisites

-   Node.js (v18.x or higher)
-   npm
-   Redis Server
-   [Your chosen database] Server

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/chat-app.git
    cd chat-app
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add the following variables. Use `.env.example` as a guide.
    ```env
    PORT=3001
    DATABASE_URL="your_database_connection_string"
    REDIS_URL="redis://localhost:6379"
    JWT_SECRET="your_super_secret_key"
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

The server will be running on `http://localhost:3001`.

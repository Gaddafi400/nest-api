# NestJS User Management Application

## Overview

This project is a NestJS-based REST API that integrates with MongoDB and RabbitMQ. It interacts with the [ReqRes API](https://reqres.in/) to manage user data and handle avatar images. The application is designed to store user information, handle avatar retrieval and storage, and send emails via RabbitMQ. Comprehensive unit and functional tests are included to ensure the reliability and correctness of the application.

## Features

- **POST /api/users**: Create a new user and store it in MongoDB. Triggers an email and RabbitMQ event (dummy sending).
- **GET /api/user/{userId}**: Retrieve user data from [ReqRes API](https://reqres.in/api/users/{userId}).
- **GET /api/user/{userId}/avatar**: Retrieve and store the user's avatar image. Returns the image in base64-encoded format.
- **DELETE /api/user/{userId}/avatar**: Delete the avatar image file from the filesystem and remove the database entry.

## Prerequisites

- Node.js >= 14.x
- TypeScript >= 3.4
- MongoDB >= 4.4
- RabbitMQ >= 3.7

## Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/your-username/your-repository.git
    cd your-repository
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Set up environment variables**

    Create a `.env` file in the root directory of the project with the following content:

    ```env
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/your-database
    RABBITMQ_URL=amqp://guest:guest@localhost:5672
    MAILTRAP_USERNAME=your-mailtrap-username
    MAILTRAP_PASSWORD=your-mailtrap-password
    ```

4. **Run the application**

    ```bash
    npm run start
    ```

## Docker Setup

To run the application using Docker, follow these steps:

1. **Build and run Docker containers**

    ```bash
    docker-compose up --build
    ```

   This command builds the Docker images and starts the containers for the application, MongoDB, and RabbitMQ.

2. **Stop Docker containers**

    ```bash
    docker-compose down
    ```

   This command stops and removes the Docker containers.

## API Endpoints

### 1. Create User

- **Endpoint:** `POST /api/users`
- **Request Body:**

    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "securepassword"
    }
    ```

- **Response:**

    ```json
    {
      "token": "your-jwt-token"
    }
    ```

### 2. Retrieve User Data

- **Endpoint:** `GET /api/user/{userId}`
- **Response:**

    ```json
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
    ```

### 3. Retrieve User Avatar

- **Endpoint:** `GET /api/user/{userId}/avatar`
- **Response:**

    ```json
    {
      "avatar": "base64-encoded-avatar-string"
    }
    ```

### 4. Delete User Avatar

- **Endpoint:** `DELETE /api/user/{userId}/avatar`
- **Response:**

    ```json
    {
      "message": "Avatar deleted successfully"
    }
    ```

## Testing

### Unit Tests

Run unit tests using:

```bash
npm run test

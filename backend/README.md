# FleetDash Backend

## Project Description

FleetDash is a Fleet Management System backend developed using Node.js, Express.js, and MongoDB. It provides REST APIs to manage vehicles, drivers, trips, and user authentication.

---

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Postman
- Socket.IO (Real-time module)

---

## Installation

1. Clone the repository

```bash
git clone <repository-url>
```

2. Navigate to the backend folder

```bash
cd backend
```

3. Install dependencies

```bash
npm install
```

4. Configure the `.env` file

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

5. Start the server

```bash
npm run dev
```

---

## API Endpoints

### Authentication

| Method | Endpoint |
|---------|----------|
| POST | /api/auth/register |
| POST | /api/auth/login |

### Vehicles

| Method | Endpoint |
|---------|----------|
| GET | /api/vehicles |
| GET | /api/vehicles/:id |
| POST | /api/vehicles |
| PUT | /api/vehicles/:id |
| DELETE | /api/vehicles/:id |

### Drivers

| Method | Endpoint |
|---------|----------|
| GET | /api/drivers |
| GET | /api/drivers/:id |
| POST | /api/drivers |
| PUT | /api/drivers/:id |
| DELETE | /api/drivers/:id |

### Trips

| Method | Endpoint |
|---------|----------|
| GET | /api/trips |
| GET | /api/trips/:id |
| POST | /api/trips |
| PUT | /api/trips/:id |
| DELETE | /api/trips/:id |

---

## Testing

All APIs were tested using Postman.

---

## Author

Swathi Patgar
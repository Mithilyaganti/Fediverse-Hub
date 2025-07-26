# Fediverse Hub

A modern React-based frontend for interacting with Fediverse platforms, built with Vite, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/downloads)

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/Mithilyaganti/Fediverse-Hub.git
   cd Fediverse-Hub
   ```

2. **Run with Docker (Recommended)**

   ```bash
   # Build and start the development server
   docker-compose up --build
   ```

   The application will be available at: **http://localhost:5173**

3. **Alternative: Local Development Setup**

   If you prefer to run without Docker, ensure you have Node.js 18+ installed:

   ```bash
   # Navigate to frontend directory
   cd frontend

   # Install dependencies
   npm install

   # Start development server
   npm run dev
   ```

## 🛠️ Available Commands

### Docker Commands

```bash
# Start the application
docker-compose up

# Build and start (rebuild if changes made)
docker-compose up --build

# Run in background
docker-compose up -d

# Stop the application
docker-compose down

# View logs
docker-compose logs -f
```

### Local Development Commands

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 📁 Project Structure

```
Fediverse-Hub/
├── docker-compose.yml          # Docker Compose configuration
├── frontend/                   # React frontend application
│   ├── Dockerfile             # Frontend Docker configuration
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   └── pages/            # Page components
│   ├── public/               # Static assets
│   ├── package.json          # Dependencies and scripts
│   └── vite.config.ts        # Vite configuration
└── phases/                   # Development phase documentation
```

## 🔧 Technologies Used

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload, ESLint

## 🌐 Environment Variables

The application uses the following environment variable:

- `VITE_API_BASE_URL`: Base URL for API calls (default: `http://localhost:3000`)

## 🐛 Troubleshooting

### Docker Issues

If you encounter Docker build issues:

```bash
# Clean Docker cache and rebuild
docker system prune -f
docker-compose build --no-cache
docker-compose up
```

### Port Already in Use

If port 5173 is already in use:

```bash
# Check what's using the port
lsof -i :5173

# Kill the process or modify docker-compose.yml to use a different port
```

### npm Install Issues

If npm install fails in the container:

```bash
# Try building with host network
docker build --network=host -t fediverse-frontend ./frontend
```

## 📝 Development Phases

This project is developed in phases:

- **Phase 1**: ✅ Frontend containerization with Docker
- **Phase 2**: 🔄 Currently in development
- **Future Phases**: Backend integration, Fediverse API connections

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy coding! 🎉**

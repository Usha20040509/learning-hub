# Learning Hub Backend

This backend provides the server-side infrastructure for the Learning Hub internal training portal.

## Features

- FastAPI application setup
- SQLAlchemy 2.x session management
- SQLite configuration
- Alembic migration support
- Environment variable configuration
- Dependency injection
- Logging
- Global exception handling
- CORS support
- Health endpoint

## Project Structure

- app/api: API dependencies and shared entrypoints
- app/routers: route definitions
- app/services: business logic
- app/repositories: data access abstraction
- app/models: SQLAlchemy models
- app/schemas: Pydantic schemas
- app/database: database configuration and session handling
- app/config: environment/settings configuration
- app/utils: logging and exception utilities
- app/mcp: MCP integration placeholder
- app/agents: agent integration placeholder

## Getting Started

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Create a .env file based on .env.example.
3. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Health Check

- GET /health

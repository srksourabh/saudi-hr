@echo off
cd /d "%~dp0"
echo Starting HRMS App...
echo.
echo PostgreSQL and Redis should be running via Docker.
echo To start them: docker compose -f docker\docker-compose.yml up -d postgres redis
echo.
pnpm dev
pause

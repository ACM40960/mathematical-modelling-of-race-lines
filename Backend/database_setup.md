# PostgreSQL Database Setup for F1 Track Selection

## Overview

This guide helps you set up PostgreSQL for the F1 racing line optimization system to enable track selection from a predefined dataset.

## Quick Setup

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Create database and user
CREATE DATABASE f1_tracks_db;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE f1_tracks_db TO your_username;
\q
```

### 3. Set Environment Variable

Create a `.env` file in the Backend directory:

```bash
# Backend/.env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/f1_tracks_db
```

### 4. Install Python Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### 5. Start the Backend

```bash
cd Backend
python main.py
# or
uvicorn main:app --reload --port 8000
```

The database tables will be automatically created and populated with sample F1 tracks on first startup.

## What's Included

The system comes with 5 famous F1 circuits:

1. **Circuit de Monaco** - The prestigious street circuit
2. **Silverstone Circuit** - Home of British motorsport
3. **Suzuka International Racing Course** - Technical figure-8 layout
4. **Circuit de Spa-Francorchamps** - Legendary Ardennes circuit
5. **Autodromo Nazionale di Monza** - The temple of speed

## API Endpoints

- `GET /tracks` - List all available tracks with filtering
- `GET /tracks/{id}` - Get specific track data for simulation
- `GET /tracks/filter/countries` - Get available countries
- `GET /tracks/filter/types` - Get available circuit types

## Database Schema

```sql
CREATE TABLE predefined_tracks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL,
    circuit_type VARCHAR(20) NOT NULL,
    track_points JSON NOT NULL,
    width FLOAT NOT NULL,
    friction FLOAT NOT NULL DEFAULT 0.7,
    track_length FLOAT NOT NULL,
    description TEXT,
    preview_image_url VARCHAR(255),
    difficulty_rating INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    elevation_change FLOAT,
    number_of_turns INTEGER,
    fastest_lap_time FLOAT,
    year_built INTEGER
);
```

## Frontend Integration

The frontend now includes:
- **Track Selector Modal** - Browse and select from available circuits
- **Filter by Country/Type** - Easy circuit discovery
- **Search Functionality** - Find circuits by name or country
- **Circuit Information** - View track details before selection

## Usage

1. Start the backend server
2. Open the frontend application
3. Click "SELECT F1 CIRCUIT" in the Track Control panel
4. Browse available circuits and click to select
5. The selected track will be loaded onto the canvas
6. Add cars and run simulation as usual

## Troubleshooting

**Database Connection Issues:**
- Verify PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Check connection string in `.env` file
- Ensure database and user exist

**No Tracks Showing:**
- Check backend logs for database initialization errors
- Verify the database was created successfully
- Try restarting the backend to trigger data population

**Frontend API Errors:**
- Ensure backend is running on port 8000
- Check CORS configuration in `main.py`
- Verify API endpoints are accessible at `http://localhost:8000/tracks` 
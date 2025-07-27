# F1 Racing Line Optimization - Backend Setup

## PostgreSQL Setup

### Install PostgreSQL (macOS)
```bash
brew install postgresql@15
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
brew services start postgresql@15
createdb f1_tracks_db
```

### Install Backend Dependencies
```bash
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Running the Application

### Start Backend
```bash
cd Backend
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
python3 -m uvicorn main:app --reload --port 8000
```

### Start Frontend (separate terminal)
```bash
cd frontend
npm install
npm run dev
```

## Database Features

- **7 F1 Tracks**: Monaco, Baku, Silverstone, Suzuka, Spa, Monza, Interlagos
- **Auto-initialization**: Database tables and tracks created automatically
- **Track data**: Stored in PostgreSQL with detailed point coordinates

## Troubleshooting

**Kill backend process:**
```bash
lsof -ti:8000 | xargs kill -9 2>/dev/null
```

**Database issues:**
```bash
brew services restart postgresql@15
```

Access at: http://localhost:3000 
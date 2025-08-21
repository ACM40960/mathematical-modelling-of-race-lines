# Release Notes - Version 1.0.0
**Release Date**: January 2025

## Features
• **3 Racing Line Algorithms**: Basic (60% track usage), Physics (85%), Kapania (85%)
• **Interactive Track Designer**: Paper.js canvas with freehand drawing
• **Real-time Analysis**: Curvature computation and track boundaries
• **11+ F1 Circuit Presets**: Pre-built tracks with accurate specifications
• **Vehicle Configuration**: Complete F1 physics parameters and customization
• **Multi-car Optimization**: Racing line separation with collision avoidance
• **Performance Dashboard**: Speed profiles and lap time comparisons

## Technical
• **Docker Support**: Complete containerization with custom images
• **Tech Stack**: FastAPI, Next.js 15, React 19, PostgreSQL
• **Performance**: 0.1-5s computation times depending on algorithm
• **Stanford Research**: Kapania two-step algorithm implementation

## Installation
```bash
# Docker (Recommended)
docker-compose up --build

# Manual
cd backend && pip install -r requirements.txt
cd frontend && npm install && npm run dev
```

## Credits
• **Joel Thomas Chacko** (24220504) - Lead Developer
• **Sarosh Farhan** (24210969) - Frontend & Physics  
• **University College Dublin** - ACM40960 Mathematical Modelling

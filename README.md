# Mathematical Modelling of Race Lines

A research-grade racing line optimization platform implementing three mathematical models for F1 trajectory planning. Built with Next.js frontend and FastAPI backend.

## Table of Contents

- [System Architecture](#system-architecture)
- [Racing Line Models](#racing-line-models)
- [Model Processing Pipeline](#model-processing-pipeline)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
- [Technical Stack](#technical-stack)
- [Model Comparison](#model-comparison)
- [Key Equations](#key-equations)
- [Documentation](#documentation)
- [Project Demo](#project-demo)
- [Contact & Credits](#contact--credits)


## Repository Structure

<details>
<summary>📁 Project Structure (Click to expand)</summary>

```
project-maths-modelling-project-sarosh-farhan/
├── Backend/                          # FastAPI Backend
│   ├── data/
│   │   └── track_data.py            # Sample F1 track data
│   ├── schemas/
│   │   ├── track.py                 # Database models & Pydantic schemas
│   │   └── response.py              # API response models
│   ├── simulation/
│   │   ├── algorithms/              # Racing line models
│   │   │   ├── base_model.py        # Abstract base class
│   │   │   ├── basic_model.py       # Simple geometric model
│   │   │   ├── physics_model.py     # Physics-based optimization
│   │   │   └── kapania_model.py     # Two-step algorithm
│   │   ├── aerodynamics.py          # Aerodynamic calculations
│   │   ├── curvilinear_coordinates.py # Track geometry
│   │   └── optimizer.py             # Main optimization orchestrator
│   ├── tests/                       # Testing & analysis
│   │   ├── models/
│   │   │   └── advanced_analysis_results/ # Research outputs
│   │   └── demo_kapania_analysis.py
│   ├── database.py                  # PostgreSQL connection
│   ├── main.py                      # FastAPI application
│   └── requirements.txt             # Python dependencies
├── frontend/                        # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Main application
│   │   │   ├── track-designer/      # Track drawing interface
│   │   │   └── parameter-analysis/  # Model controls
│   │   ├── components/
│   │   │   ├── CanvasDrawPaper.tsx  # Paper.js canvas
│   │   │   ├── TrackControl.tsx     # Track parameters
│   │   │   ├── CarControl.tsx       # Vehicle settings
│   │   │   └── ParameterAnalysis.tsx # Model selection
│   │   ├── lib/
│   │   │   └── dataStore.ts         # State management
│   │   └── types/
│   │       └── index.ts             # TypeScript definitions
│   ├── package.json                 # Node.js dependencies
│   └── next.config.ts               # Next.js configuration
├── docs/                            # Documentation
│   ├── models/
│   │   ├── poster/                  # Research presentation
│   │   │   ├── poster.md           # Academic documentation
│   │   │   ├── poster.ipynb        # Jupyter notebook
│   │   │   └── images/             # Generated visualizations
│   │   ├── physics-based-model.md  # Physics model docs
│   │   └── kapania-two-step-algorithm.md # Kapania docs
│   ├── demo/
│   │   └── physics-based/          # Component demonstrations
│   │       ├── 01_corner_speed_calculation.py
│   │       ├── 02_straight_speed_calculation.py
│   │       ├── 03_late_apex_strategy.py
│   │       ├── 04_lap_optimization.py
│   │       └── 05_complete_physics_integration.py
│   └── backend-flow-diagram.md     # System architecture
└── README.md                       # This file
```

</details>

## System Architecture

```mermaid
graph LR
    subgraph "Frontend (Next.js)"
        A["Track Designer<br/>Canvas Drawing"] 
        B["Parameter Analysis<br/>Model Controls"]
    end
    
    subgraph "Backend (FastAPI)"
        D["API Endpoints<br/>/optimize, /tracks"]
        E["Racing Line Optimizer<br/>Model Orchestration"]
        F["Track Processing<br/>Curvature & Geometry"]
    end
    
    subgraph "Database (PostgreSQL)"
        J["Track Storage<br/>Predefined F1 Circuits"]
    end
    
    subgraph "Racing Line Models"
        G["Basic Model<br/>Simple Geometry"]
        H["Physics Model<br/>Lap Time Min"]
        I["Kapania Model<br/>2 Step Algorithm"]
    end
    
    A --> D
    B --> D
    D --> J
    D --> E
    E --> F
    F --> G
    F --> H
    F --> I
    G --> E
    H --> E
    I --> E
    E --> D
    
    style A fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style B fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style D fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style E fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style F fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style G fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style H fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style I fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style J fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
```

## Model Processing Pipeline

```mermaid
flowchart TD
    A[Track Points Input] --> B[Curvature Calculation]
    B --> C[Model Selection]
    
    subgraph Basic["Basic Model Pipeline"]
        D1[Geometric Analysis] --> D2[Conservative Offsets] --> D3[Smooth Curves]
    end
    
    subgraph Physics["Physics Model Pipeline"]
        E1["Corner Speed Calc<br/>v = sqrt(μN/mκ)"] --> E2["Aerodynamic Forces<br/>F = 0.5ρv²CA"]
        E2 --> E3["Racing Line Offsets<br/>Late Apex Strategy"]
        E3 --> E4["Lap Time Integration<br/>T = ∫(1/v)ds"]
        E4 --> E5{"Converged?<br/>|T_new - T_old| < 0.15s"}
        E5 -->|No| E1
        E5 -->|Yes| E6[Optimized Path]
    end
    
    subgraph Kapania["Kapania Model Pipeline"]
        F1[Max Speed Calculation] --> F2["Forward Integration<br/>Acceleration Limits"]
        F2 --> F3["Backward Integration<br/>Braking Limits"]
        F3 --> F4{"Converged?<br/>5 iterations max"}
        F4 -->|No| F1
        F4 -->|Yes| F5[Optimized Path]
    end
    
    C --> Basic
    C --> Physics
    C --> Kapania
    
    D3 --> G[Path Smoothing]
    E6 --> G
    F5 --> G
    
    G --> H[Multi-Car Separation]
    H --> I[Racing Line Output]
    
    style A fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style B fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style C fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style D1 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style D2 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style D3 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style E1 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style E2 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style E3 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style E4 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style E5 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style E6 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style F1 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style F2 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style F3 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style F4 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style F5 fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style G fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style H fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style I fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- npm 8+

### Installation
```bash
# Clone repository
git clone <repo-url>
cd <repo-url>

# Frontend setup
cd frontend && npm install

# Backend setup  
cd ../Backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Development
```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd Backend && uvicorn main:app --reload --port 8000
```

Access: http://localhost:3000

## Technical Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 14, React, TypeScript | Interactive track designer |
| Backend | FastAPI, Python 3.8+ | Racing line optimization API |
| Database | PostgreSQL | F1 track data storage |
| UI Framework | Tailwind CSS | Modern responsive design |
| Canvas | Paper.js | Interactive track drawing |
| Math/Science | NumPy, SciPy | Physics calculations |
| Optimization | Iterative algorithms | Lap time minimization |


## Documentation

- **Models**: `/docs/models/` - Mathematical documentation
- **Demo Scripts**: `/docs/demo/physics-based/` - Component visualizations
- **Poster**: `/docs/models/poster/` - Research presentation materials

---

## Images

**Include Images**


## Contact & Credits
- Created by Joel Thomas Chacko (24220504) and Sarosh Farhan.
- For questions, suggestions, or contributions, please open an issue or pull request.

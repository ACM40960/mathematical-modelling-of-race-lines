# F1 Racing Line Designer - Frontend Application

A sophisticated web application for designing, analyzing, and simulating racing lines on Formula 1 tracks. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS, featuring advanced racing line optimization algorithms and interactive track design capabilities.

## Overview

This frontend application provides a comprehensive platform for F1 racing line analysis, featuring:

- **Interactive Track Design**: Draw custom racing lines with real-time track boundary computation
- **Advanced Car Physics**: Configure detailed vehicle parameters for realistic simulation
- **Multiple Racing Models**: Support for physics-based and Kapania two-step algorithms
- **Track Presets**: Pre-built F1 circuit templates with real-world specifications
- **Data Persistence**: Local storage for tracks, cars, and simulation results

## Technology Stack

- **Framework**: Next.js 15.3.4 with App Router
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.10
- **Graphics**: Paper.js for advanced canvas operations
- **Animations**: Anime.js for smooth transitions
- **Development**: ESLint, Turbopack for fast development

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Backend API**: Running instance of the racing line optimization backend

## Installation and Setup

### 1. Clone and Navigate
```bash
git clone https://github.com/ACM40960/mathematical-modelling-of-race-lines.git

cd mathematical-modelling-of-race-lines/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Architecture

### Directory Structure

```
frontend/
├── public/                    # Static assets
│   └── F1-logo.svg           # Application logo
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout component
│   │   ├── page.tsx           # Landing page with loading animation
│   │   ├── globals.css        # Global styles
│   │   └── track-designer/    # Main application page
│   │       └── page.tsx       # Track designer interface
│   ├── components/            # React components
│   │   ├── Header.tsx         # Application header with navigation
│   │   ├── CanvasDrawPaper.tsx # Main drawing canvas with Paper.js
│   │   ├── TrackControl.tsx   # Track parameter controls
│   │   ├── CarControl.tsx     # Vehicle configuration interface
│   ├── lib/                   # Utility libraries
│   │   └── dataStore.ts       # Local storage management
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts           # Core type interfaces
│   └── services/              # API service layer (future)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── README.md                  # This documentation
```

### Core Components

#### CanvasDrawPaper.tsx
The primary drawing interface built with Paper.js, providing:
- Interactive racing line drawing with mouse/touch input
- Real-time track boundary computation using normal vector methods
- Support for multiple drawing layers and visualization modes
- Integration with simulation results display

#### CarControl.tsx
Comprehensive vehicle configuration interface featuring:
- Physical parameters (mass, dimensions, steering limits)
- Aerodynamic properties (drag coefficient, downforce)
- Tire and suspension characteristics
- Performance limits (speed, acceleration, braking)
- Visual customization (team colors, livery)

#### TrackControl.tsx
Track parameter management including:
- Track width and friction coefficient adjustment
- Discretization step control for simulation accuracy
- Track length calculation and display
- Preset track selection and loading

#### Header.tsx
Application navigation and branding with:
- F1 branding and logo display
- Navigation between application sections
- User session management
- Application state indicators

### Data Management

#### TypeScript Interfaces
The application uses comprehensive type definitions for:

- **Car**: Complete vehicle specification with physics parameters
- **Track**: Track geometry and properties
- **Point**: 2D coordinate representation
- **SimulationResult**: Optimization algorithm outputs
- **TrackPreset**: Pre-built circuit templates

#### Local Storage
Persistent data management through `dataStore.ts`:
- Track and car configurations
- Simulation results and settings
- User preferences and model selections
- Cross-tab synchronization support

## Key Features

### Track Design
- **Freehand Drawing**: Intuitive mouse/touch input for racing line creation
- **Track Boundaries**: Automatic computation of track edges based on centerline
- **Preset Tracks**: Library of real F1 circuits with accurate specifications

### Vehicle Configuration
- **Physics Parameters**: Mass, inertia, cornering stiffness
- **Aerodynamics**: Drag coefficient, downforce, frontal area
- **Performance Limits**: Maximum speeds, acceleration, braking
- **Visual Customization**: Team colors and livery options

### Simulation and Analysis
- **Multiple Algorithms**: Basic, Physics-based and Kapania two-step models
- **Real-time Optimization**: Backend integration for racing line computation which computes race lines in real time.

### User Experience
- **Loading States**: Smooth transitions and progress indicators
- **Error Handling**: Graceful degradation and user feedback

## Development Workflow

### Available Scripts
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint for code quality
```

### Code Quality
- **TypeScript**: Strict type checking for all components
- **ESLint**: Code style and quality enforcement
- **Component Structure**: Modular, reusable component architecture
- **Documentation**: Comprehensive inline comments and type definitions

## API Integration

The frontend integrates with a Python backend providing:
- Racing line optimization algorithms
- Physics-based simulation models
- Track data management

### Backend Communication
- RESTful API endpoints for simulation requests
- Real-time data exchange for optimization results
- Error handling and retry mechanisms
- Progress tracking for long-running simulations

## Performance Considerations

- **Dynamic Imports**: Heavy components loaded on-demand
- **Canvas Optimization**: Efficient Paper.js rendering
- **State Management**: Optimized React state updates
- **Storage Efficiency**: Compressed local storage usage

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Canvas Support**: Full HTML5 Canvas API support required
- **Local Storage**: Browser local storage for data persistence
- **Touch Support**: Mobile and tablet drawing capabilities

## Contributing

### Code Structure
- Use functional components with React hooks
- Implement proper error boundaries
- Follow Tailwind CSS utility-first approach
- Maintain consistent file naming conventions

## License

This project is developed for educational and research purposes in mathematical modeling and racing line optimization.

## Contact

- **Developers**: Sarosh Farhan, Joel Thomas Chacko
- **Project**: Mathematical Modelling of Race Lines
- **Institution**: University College Dublin

For technical support, feature requests, or contributions, please refer to the project repository issues and documentation.

# F1 Racing Lines - Next.js + React + Tailwind CSS

This project is a modern web application for drawing, analyzing, and visualizing racing lines on F1 tracks. It is built with Next.js, React, and Tailwind CSS, and features an interactive canvas for drawing tracks, a control panel for track parameters, and a modular, extensible architecture.

## Features
- **Interactive Canvas:** Draw racing lines with your mouse or pen. The app computes and displays the track boundaries based on a user-defined width.
- **Track Control Panel:** Adjust track width, discretization step, and (future) see curvature profiles and other analytics.
- **Responsive Layout:** Clean, modern UI with a header, main canvas area, and a control panel.
- **Fully Commented Code:** All components are well-documented for easy onboarding and collaboration.

---

## Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v8 or higher)

---

## Getting Started

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd project-maths-modelling-project-sarosh-farhan/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```

- Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.
- The app will automatically reload as you edit files.

---

## Project Structure

```
frontend/
├── public/                # Static assets (e.g., F1 logo)
├── src/
│   ├── app/               # Next.js app directory (pages, layout, globals)
│   ├── components/        # Reusable React components
│   │   ├── CanvasDraw.tsx # Main drawing canvas (core logic)
│   │   └── TrackControl.tsx # Track control panel (inputs, analytics)
│   └── ...
├── package.json           # Project metadata and scripts
├── postcss.config.mjs     # PostCSS configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

---

## How It Works

- **CanvasDraw.tsx:**
  - Lets users draw a racing line with the mouse.
  - Computes and displays the track boundaries (ribbon) using a normal vector method.
  - The width of the track can be adjusted live from the control panel.
  - All code is commented for clarity and future extension.

- **TrackControl.tsx:**
  - Lets users set the track width, discretization step, and (future) track length.
  - Will display analytics like curvature profile in future versions.

- **State Management:**
  - The main page (`src/app/page.tsx`) holds the shared state for the drawn lines and track width, passing them as props to the relevant components.

---

## Customization & Contribution

- **To add new features:**
  - Create new components in `src/components/` and import them in `src/app/page.tsx`.
  - Follow the commenting style for clarity.
- **To change the drawing logic:**
  - Edit `CanvasDraw.tsx`. You can swap out the normal vector method for a more advanced offsetting library if needed.
- **To style the app:**
  - Use Tailwind CSS classes in your components.

---

## Troubleshooting
- If you see errors about Node.js version, upgrade to the latest LTS version.
- If the canvas does not resize or boundaries look odd, try drawing longer, smoother lines and adjust the track width.
---

## License
This project is for educational and research purposes. See LICENSE file for details (if present).

---

## Contact & Credits
- Created by Sarosh Farhan and Joel Chacko.
- For questions, suggestions, or contributions, please open an issue or pull request.

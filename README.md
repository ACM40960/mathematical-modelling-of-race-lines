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
cd project-maths-modelling-project-sarosh-farhan
```

### 2. Install Dependencies

Front end
```bash
cd frontend
npm install
```

Backend
```bash
python -m venv <venv>
source <venv>/bin/activate
pip install -r requirements.txt
```

### 3. Run the Development Server
Front End
```bash
cd frontend && npm run dev
```

Back End (Uvicorn)
```bash
cd Backend && uvicorn main:app --reload --host 0.0.0.0 --port <desired port>
```

- Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.
- The app will automatically reload as you edit files.

---

## Project Structure

// needs to be updated

## License
This project is for educational and research purposes. See LICENSE file for details (if present).

---

## Contact & Credits
- Created by Sarosh Farhan and Joel Chacko.
- For questions, suggestions, or contributions, please open an issue or pull request.

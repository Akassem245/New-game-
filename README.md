# New Game

A 3D procedural city simulation built with Three.js and Vite.

## Planned Structure

```
/
├── README.md
├── .gitignore
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── main.js
│   ├── world/
│   │   ├── cityGenerator.js
│   │   ├── roads.js
│   │   ├── buildings.js
│   │   └── greenArea.js
│   ├── player/
│   │   └── firstPersonController.js
│   ├── vehicles/
│   │   ├── minibus.js
│   │   └── tuktuk.js
│   └── pedestrians/
│       └── crowdSystem.js
└── public/
```

## Phase 1
- Vite + Three.js setup
- 2 km × 1 km world
- Procedural roads
- Procedural buildings
- First-person movement

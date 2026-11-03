# New Game — Procedural City

A browser-based 3D city exploration prototype built with **Three.js** and **Vite**.

## World layout

- **City:** 1 km², occupying the western half of the world.
- **Green area:** 1 km² park immediately east of the city.
- **Main streets:** 8 m wide.
- **Side streets and alleys:** 3 m wide.
- **Buildings:** 8 floors in neighborhood blocks and 12 floors along main avenues (3.1 m floor-to-floor approximation).
- **Traffic:** animated minibus and tuk-tuk prototypes.
- **Crowd:** instanced animated pedestrian sample to suggest a dense urban environment.
- **Player:** first-person mouse-look and keyboard movement.

> The requested population of 100,000 is the city's design population target, not 100,000 individually simulated NPCs. The current prototype renders a smaller instanced crowd sample to keep browser performance practical.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Controls

- Click the scene to capture the mouse.
- **W / A / S / D** or arrow keys: move.
- **Mouse:** look around.
- **Shift:** run.
- **Esc:** release the mouse.

## Current implementation

- Procedural city grid and building placement.
- Instanced building and window meshes.
- Separate green park with paths and trees.
- Moving minibus and tuk-tuk models.
- Instanced pedestrian crowd.
- First-person exploration.

## Next development steps

Collision-aware navigation, proper vehicle lane routing, pedestrian pathfinding, detailed Egyptian-style building assets, audio, and mobile touch controls.

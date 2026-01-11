import './style.css'
import { WorldView } from './renderer/WorldView';
import { wrap } from 'comlink';
import type { WorldGenerator } from './worker/generator.worker';
import { ECSWorld } from './core/ECS';
import { LoreSystem } from './systems/LoreSystem';
import { HistorySystem } from './systems/HistorySystem';

const app = document.querySelector<HTMLDivElement>('#app')!
const worldView = new WorldView(app);
const ecs = new ECSWorld();

// Systems
const loreSystem = new LoreSystem(ecs);
const historySystem = new HistorySystem(ecs);
ecs.addSystem(loreSystem);
ecs.addSystem(historySystem);

// Worker
const worker = new Worker(new URL('./worker/generator.worker', import.meta.url), { type: 'module' });
const generator = wrap<WorldGenerator>(worker);

(async () => {
  console.log("Initializing V2 Engine...");

  // 1. Generate Map
  console.time("Worker Generation");
  try {
    const data = await generator.generate(1000, 1000, 10);
    console.timeEnd("Worker Generation");
    console.log(`Main: Received ${data.numCells} cells`);

    // 2. Render
    const mockGrid = { points: data.points, width: 1000, height: 1000, numCells: data.numCells };
    // @ts-ignore
    worldView.renderGrid(mockGrid);
  } catch (e) {
    console.error("Generation failed:", e);
  }

  // 3. Setup World Building (ECS)
  console.log("--- Starting World Simulation ---");

  // Add some Lore
  loreSystem.createLoreEntry("Kingdom of Arnor", "Nation", "A mighty kingdom in the North.");
  loreSystem.createLoreEntry("King Elessar", "Character", "Ruler of [[Kingdom of Arnor]].");

  // Simulate History
  for (let i = 0; i < 5; i++) {
    historySystem.update(1.0);
  }

  // Check Lore Links
  const king = loreSystem.getLore("King Elessar");
  if (king !== undefined) {
    console.log("Lore System verified: King Elessar exists.");
  }
})();

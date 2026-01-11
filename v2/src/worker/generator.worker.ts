
import { expose, transfer } from "comlink";
import { Grid } from "../core/Grid";

export class WorldGenerator {
    public generate(width: number, height: number, spacing: number) {
        console.log("Worker: Starting Grid Generation...");
        const grid = new Grid(width, height, spacing);

        // We cannot return the 'Grid' instance directly because it has methods and complex properties (Delaunay).
        // We must return the raw data arrays.

        const points = grid.points;

        // Transfer the buffer to avoid copying
        return transfer({
            points: points,
            numCells: grid.numCells
        }, [points.buffer]);
    }
}

expose(new WorldGenerator());


import { Delaunay } from "d3-delaunay";
import { PoissonDiskSampling } from "./PoissonDiskSampling";

export class Grid {
    public points: Float64Array;
    public delaunay: Delaunay<unknown>;
    public voronoi: any;
    public numCells: number;
    public width: number;
    public height: number;


    constructor(width: number, height: number, desiredSpacing: number = 5) {
        this.width = width;
        this.height = height;

        // 1. Generate Points using Poisson Disc Sampling
        const sampler = new PoissonDiskSampling(width, height, desiredSpacing);
        this.points = sampler.generate();
        this.numCells = this.points.length / 2;

        // 2. Build Graph
        this.delaunay = new Delaunay(this.points);
        this.voronoi = this.delaunay.voronoi([0, 0, width, height]);
    }

    public getCellPolygon(i: number): number[] | null {
        return this.voronoi.cellPolygon(i);
    }

    public getNeighbors(i: number): IterableIterator<number> {
        return this.voronoi.neighbors(i);
    }
}

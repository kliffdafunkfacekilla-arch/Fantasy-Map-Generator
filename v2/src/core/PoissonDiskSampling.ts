
export class PoissonDiskSampling {
    private width: number;
    private height: number;
    private r: number;
    private k: number;
    private grid: Array<number | null>;
    private active: number[][]; // List of active point indices
    private points: number[][];
    private cellSize: number;
    private cols: number;
    private rows: number;

    constructor(width: number, height: number, r: number, k: number = 30) {
        this.width = width;
        this.height = height;
        this.r = r; // Minimum distance between points
        this.k = k; // Rejection limit

        this.cellSize = r / Math.sqrt(2);
        this.cols = Math.floor(width / this.cellSize);
        this.rows = Math.floor(height / this.cellSize);

        this.grid = new Array(this.cols * this.rows).fill(null);
        this.active = [];
        this.points = [];
    }

    public generate(): Float64Array {
        // Add first random point
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        const p0 = [x, y];

        this.insertPoint(p0);
        this.active.push(p0);

        while (this.active.length > 0) {
            const randIndex = Math.floor(Math.random() * this.active.length);
            const p = this.active[randIndex];
            let found = false;

            for (let i = 0; i < this.k; i++) {
                const angle = Math.random() * 2 * Math.PI;
                // Random distance between r and 2r
                const dist = Math.random() * this.r + this.r;
                const newX = p[0] + Math.cos(angle) * dist;
                const newY = p[1] + Math.sin(angle) * dist;
                const newP = [newX, newY];

                if (this.isValid(newP)) {
                    this.insertPoint(newP);
                    this.active.push(newP);
                    found = true;
                    break; // Optimization: only need one success to keep p active? No, classic algo continues. 
                    // Actually, standard algo: if we find a point, great. 
                    // If after k tries we find no points, we remove p from active.
                    // So "break" here means "we found a neighbor for P, so P is still useful? 
                    // No, standard algo says picking ONE valid neighbor is enough to keep loop going.
                    // But strictly, we keep P in active list until it has no valid space around it.
                    // Usually simplified: Try k times. If SUCCESS, add new point and keep P. 
                    // Wait, Bridgson's algo: Pick P. Try k candidates. If ALL fail, remove P. 
                }
            }

            if (!found) {
                this.active.splice(randIndex, 1);
            }
        }

        // Convert to Float64Array for d3-delaunay
        const flatArray = new Float64Array(this.points.length * 2);
        for (let i = 0; i < this.points.length; i++) {
            flatArray[i * 2] = this.points[i][0];
            flatArray[i * 2 + 1] = this.points[i][1];
        }
        return flatArray;
    }

    private insertPoint(p: number[]) {
        const col = Math.floor(p[0] / this.cellSize);
        const row = Math.floor(p[1] / this.cellSize);
        this.grid[col + row * this.cols] = this.points.length; // Store index
        this.points.push(p);
    }

    private isValid(p: number[]): boolean {
        if (p[0] < 0 || p[0] >= this.width || p[1] < 0 || p[1] >= this.height) return false;

        const col = Math.floor(p[0] / this.cellSize);
        const row = Math.floor(p[1] / this.cellSize);

        // Check neighboring cells (5x5 grid around, or 3x3 suffices for r/sqrt(2)?)
        // 5x5 is safer to cover 2r radius? 
        // Actually cell size is r/sqrt(2). Diagonal is r. 
        // We need to check neighbors within distance r.
        // 2 cells away is > 1.4r, so 5x5 is overkill? 
        // Standard is usually checking [-2, -1, 0, 1, 2] offsets.

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const index = (col + i) + (row + j) * this.cols;
                const neighborIdx = this.grid[index];

                if (col + i >= 0 && col + i < this.cols && row + j >= 0 && row + j < this.rows) {
                    if (typeof neighborIdx === 'number') {
                        const neighbor = this.points[neighborIdx];
                        const d2 = (p[0] - neighbor[0]) ** 2 + (p[1] - neighbor[1]) ** 2;
                        if (d2 < this.r ** 2) return false;
                    }
                }
            }
        }
        return true;
    }
}


import * as THREE from 'three';
import { Grid } from '../core/Grid';

export class WorldView {
    private container: HTMLElement;
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private renderer: THREE.WebGLRenderer;
    private gridMesh: THREE.Points | null = null;
    private width: number;
    private height: number;

    constructor(container: HTMLElement) {
        this.container = container;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // 1. Setup Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        // 2. Setup Camera (Orthographic for map view)
        // View size roughly 1000 units?
        const frustumSize = 1000;
        const aspect = this.width / this.height;
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1,
            10000
        );
        this.camera.position.z = 10;
        this.camera.position.x = 500;
        this.camera.position.y = 500;
        this.camera.lookAt(500, 500, 0);

        // 3. Setup Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Resize handler
        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.animate();
    }

    private onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        const frustumSize = 1000;
        const aspect = this.width / this.height;

        this.camera.left = -frustumSize * aspect / 2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = -frustumSize / 2;

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
    }

    public renderGrid(grid: Grid) {
        if (this.gridMesh) {
            this.scene.remove(this.gridMesh);
        }

        // Visualize Points for now
        const geometry = new THREE.BufferGeometry();
        // Grid.points is Flat Float64Array [x0, y0, x1, y1...]
        // BufferAttribute expects Float32
        const vertices = new Float32Array(grid.points.length / 2 * 3);

        for (let i = 0; i < grid.points.length; i += 2) {
            const k = (i / 2) * 3;
            vertices[k] = grid.points[i];
            vertices[k + 1] = grid.points[i + 1];
            vertices[k + 2] = 0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0x88ccff, size: 2 });

        this.gridMesh = new THREE.Points(geometry, material);
        this.scene.add(this.gridMesh);

        // Center camera
        this.camera.position.x = grid.width / 2;
        this.camera.position.y = grid.height / 2;
        this.camera.lookAt(grid.width / 2, grid.height / 2, 0);
    }
}

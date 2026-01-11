
import { System, ECSWorld, Entity, Component } from "../core/ECS";

export class HistoricalEventComponent extends Component {
    constructor(
        public year: number,
        public description: string
    ) { super(); }
}

export class HistorySystem extends System {
    public currentYear: number = 0;
    public events: Entity[] = [];

    constructor(world: ECSWorld) {
        super(world);
    }

    update(_delta: number): void {
        // In a real game, this might tick every second or be improved by user input
        // For now, we simulate 1 year per update call for demonstration
        this.currentYear++;
        this.simulateYear();
    }

    private simulateYear() {
        // 1. Random chance of event
        if (Math.random() < 0.1) {
            this.createEvent(`Year ${this.currentYear}: A great harvest!`);
        }

        // 2. Process existing entities (e.g. Nations growing)
        // ... iterate over relevant components ...
    }

    public createEvent(desc: string) {
        const entity = this.world.createEntity();
        this.world.addComponent(entity, new HistoricalEventComponent(this.currentYear, desc));
        this.events.push(entity);
        console.log(`[HistorySystem] ${desc}`);
    }
}

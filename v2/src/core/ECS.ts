
export type Entity = number;

export abstract class Component {
    // Marker class
}

export abstract class System {
    public world: ECSWorld;
    constructor(world: ECSWorld) {
        this.world = world;
    }
    abstract update(delta: number): void;
}

export class ECSWorld {
    private nextEntityId = 0;
    private entities: Set<Entity> = new Set();
    private components: Map<string, Map<Entity, Component>> = new Map();
    private systems: System[] = [];

    public createEntity(): Entity {
        const id = this.nextEntityId++;
        this.entities.add(id);
        return id;
    }

    public addComponent(entity: Entity, component: Component) {
        const typeName = component.constructor.name;
        if (!this.components.has(typeName)) {
            this.components.set(typeName, new Map());
        }
        this.components.get(typeName)!.set(entity, component);
    }

    public getComponent<T extends Component>(entity: Entity, componentClass: { new(...args: any[]): T }): T | undefined {
        const typeName = componentClass.name;
        return this.components.get(typeName)?.get(entity) as T;
    }

    public getComponents<T extends Component>(componentClass: { new(...args: any[]): T }): Map<Entity, T> {
        const typeName = componentClass.name;
        return (this.components.get(typeName) || new Map()) as Map<Entity, T>;
    }

    public addSystem(system: System) {
        this.systems.push(system);
    }

    public update(delta: number) {
        for (const system of this.systems) {
            system.update(delta);
        }
    }
}

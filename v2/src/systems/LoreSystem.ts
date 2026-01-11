
import { Component, ECSWorld, System, Entity } from "../core/ECS";

// Components
export class NameComponent extends Component {
    constructor(public name: string) { super(); }
}

export class LoreComponent extends Component {
    constructor(
        public type: string = "General",
        public text: string = "",
        public tags: string[] = []
    ) { super(); }
}

// The LoreSystem manages the "Wiki" aspect
export class LoreSystem extends System {
    private loreRegistry: Map<string, Entity> = new Map();

    constructor(world: ECSWorld) {
        super(world);
    }

    update(_delta: number): void {
        // Lore system doesn't necessarily need to update every frame, 
        // unless checking for broken links or indexing new content.
    }

    public createLoreEntry(name: string, type: string, content: string): Entity {
        const entity = this.world.createEntity();
        this.world.addComponent(entity, new NameComponent(name));
        this.world.addComponent(entity, new LoreComponent(type, content));

        this.loreRegistry.set(name, entity);
        console.log(`[LoreSystem] Created entry: ${name} (${type})`);
        return entity;
    }

    public getLore(name: string): Entity | undefined {
        return this.loreRegistry.get(name);
    }

    // Parse text for [[Links]]
    public parseLinks(text: string): string[] {
        const regex = /\[\[(.*?)\]\]/g;
        const matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push(match[1]);
        }
        return matches;
    }
}

export class TemporaryIdRegistry {
    private registry: Map<string, string>;


    constructor() {
        this.registry = new Map<string, string>();
    }

    getTemporaryName(key: string): string {
        if (this.registry.has(key)) {
            return this.registry.get(key)!;
        }

        const newName: string = `var${this.registry.size}`;
        this.registry.set(key, newName);
        return newName;
    }
}
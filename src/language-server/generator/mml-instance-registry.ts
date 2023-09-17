import {ObjectInstance} from "./mml-instance-templates";
import {v4 as uuidv4} from 'uuid';

/**
 * The MmlInstanceRegistry stores and resolves ids of created instances
 */
export class MmlInstanceRegistry {
    private knownInstances: Map<string, ObjectInstance> = new Map<string, ObjectInstance>()

    public getNewObjectId(obj: ObjectInstance): string {
        const newId: string = uuidv4();
        this.knownInstances.set(newId, obj);
        return newId;
    }

    public resolve(objId: string): ObjectInstance | undefined {
        return this.knownInstances.get(objId);
    }
}
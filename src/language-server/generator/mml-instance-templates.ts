import {
    FunctionMacroCall,
    IInstance,
    IMacro,
    InstanceLoop,
    InstanceStatement,
    isFunctionAssignment,
    isFunctionMacroCall,
    isInstanceLoop,
    isInstanceStatement,
    isMacroAssignStatement,
    isMacroAttributeStatement,
    MacroAssignStatement,
    MacroAttributeStatement,
    MacroInstance,
    Model,
    Variable
} from "../generated/ast";
import {MmlSerializerContext} from "./mml-serializer-context";
import {zip} from "./utils";
import {MmlReferenceStorage} from "./mml-reference-storage";
import {MmlInstanceRegistry} from "./mml-instance-registry";

export function executeMacroCall(macroCall: FunctionMacroCall, referenceStorage: MmlReferenceStorage, outerContext: MmlSerializerContext, serializer: SerializedInstance, instanceRegistry: MmlInstanceRegistry) {
    const innerContext = new MmlSerializerContext();
    if (macroCall.macro.ref != undefined) {
        const macro: IMacro = macroCall.macro.ref;
        const zipped = zip(macroCall.args, macro.parameter);
        zipped.forEach(value => {
            if (value[0].value != undefined && value[0].ref == undefined) {
                innerContext.storeValue(value[1], outerContext.evaluateArithExpr(value[0].value))
            } else if (value[0].value == undefined && value[0].ref != undefined && value[0].ref.ref != undefined) {
                const passedVariable: Variable = value[0].ref.ref;
                const resolved: any = outerContext.resolve(passedVariable);
                innerContext.storeValue(value[1], resolved);
            }
        })

        macro.instances.forEach(inst => createInstance(inst, referenceStorage, innerContext, serializer, instanceRegistry));
    }
    return innerContext;
}

export class SerializedInstances {
    readonly serializedInstances: SerializedInstance[] = [];

    constructor(model: Model, referenceStorage: MmlReferenceStorage, instanceRegistry: MmlInstanceRegistry) {
        model.instances.forEach(inst => this.serializedInstances.push(new SerializedInstance(inst, referenceStorage, instanceRegistry)));
    }
}

class SerializedInstance {
    readonly instanceName: string;
    readonly instances: ObjectInstance[] = [];

    constructor(instance: IInstance, referenceStorage: MmlReferenceStorage, instanceRegistry: MmlInstanceRegistry) {
        this.instanceName = instance.name;
        const outerContext: MmlSerializerContext = new MmlSerializerContext();
        this.executeRecursively(instance.statements, referenceStorage, outerContext, instanceRegistry);
    }

    private executeRecursively(stmts: (InstanceLoop | InstanceStatement)[], referenceStorage: MmlReferenceStorage, outerContext: MmlSerializerContext, instanceRegistry: MmlInstanceRegistry) {
        stmts.forEach(iStmt => {
            if (isInstanceStatement(iStmt)) {
                if (isFunctionAssignment(iStmt) && isFunctionMacroCall(iStmt.call)) {
                    const innerContext = executeMacroCall(iStmt.call, referenceStorage, outerContext, this, instanceRegistry);
                    if (iStmt.select != undefined && iStmt.select.ref != undefined) {
                        outerContext.storeValue(iStmt.var, innerContext.resolve(iStmt.select.ref));
                    } else {
                        outerContext.storeValue(iStmt.var, innerContext);
                    }
                }
                if (isFunctionMacroCall(iStmt)) {
                    executeMacroCall(iStmt, referenceStorage, outerContext, this, instanceRegistry);
                }
            } else if (isInstanceLoop(iStmt) && iStmt.var.ref != undefined && iStmt.ref.ref != undefined) {
                const obj: ObjectInstance = outerContext.resolve(iStmt.var.ref);
                const referencedIds = obj.references.get(iStmt.ref.ref.name)?.referencedIds || [];
                referencedIds.forEach(referencedId => {
                    const referencedObj = instanceRegistry.resolve(referencedId);
                    if (referencedObj != undefined) {
                        const newContext: MmlSerializerContext = outerContext.clone();
                        newContext.storeValue(iStmt.ivar, referencedObj);
                        this.executeRecursively(iStmt.statements, referenceStorage, newContext, instanceRegistry);
                        newContext.unsetValue(iStmt.ivar);
                        outerContext.enhance(newContext);
                    }
                });
            }
        });
    }
}

function createInstance(initializer: MacroInstance, referenceStorage: MmlReferenceStorage, context: MmlSerializerContext, serializer: SerializedInstance, instanceRegistry: MmlInstanceRegistry) {
    if (initializer.nInst != undefined && initializer.iVar == undefined) {
        context.storeValue(initializer.nInst, new ObjectInstance(initializer, referenceStorage, context, serializer, instanceRegistry));
    } else if (initializer.nInst == undefined && initializer.iVar != undefined && initializer.iVar.ref != undefined) {
        const objInstance: ObjectInstance = context.resolve(initializer.iVar.ref);
        initializer.statements.forEach(stmt => {
            if (isMacroAssignStatement(stmt)) {
                objInstance.addReference(stmt, context, referenceStorage);
            } else if (isMacroAttributeStatement(stmt)) {
                objInstance.addAttribute(stmt, context, referenceStorage);
            }
        })
    }
}

export class ObjectInstance {
    readonly referenceId: string;
    readonly referenceTypeId: string;
    readonly name: string;
    readonly attributes: Map<string, AttributeEntry> = new Map<string, AttributeEntry>();
    readonly references: Map<string, ReferenceEntry> = new Map<string, ReferenceEntry>();

    constructor(initializer: MacroInstance, referenceStorage: MmlReferenceStorage, context: MmlSerializerContext, serializer: SerializedInstance, instanceRegistry: MmlInstanceRegistry) {
        this.referenceId = instanceRegistry.getNewObjectId(this);
        if (initializer.nInst != undefined && initializer.nInst.typing.type != undefined) {
            this.referenceTypeId = referenceStorage.resolveReference(initializer.nInst.typing.type);
            this.name = initializer.nInst.name;
        } else {
            this.referenceTypeId = "$$UNKNOWN$$";
            this.name = "$$UNKNOWN$$";
        }
        initializer.statements.forEach(stmt => {
            if (isMacroAssignStatement(stmt)) {
                this.addReference(stmt, context, referenceStorage)
            } else if (isMacroAttributeStatement(stmt)) {
                this.addAttribute(stmt, context, referenceStorage);
            }
        })
        serializer.instances.push(this);
    }

    public addAttribute(attr: MacroAttributeStatement, context: MmlSerializerContext, referenceStorage: MmlReferenceStorage) {
        if (attr.attr.ref != undefined) {
            this.attributes.set(attr.attr.ref.name, {
                name: attr.attr.ref.name,
                typeId: referenceStorage.resolveReference(attr.attr),
                value: context.evaluateArithExpr(attr.value)
            });
        }
    }

    public addReference(ref: MacroAssignStatement, context: MmlSerializerContext, referenceStorage: MmlReferenceStorage) {
        if (ref.cref.ref != undefined && ref.instance.ref != undefined) {
            if (this.references.has(ref.cref.ref.name)) {
                this.references.get(ref.cref.ref.name)?.referencedIds.push((context.resolve(ref.instance.ref) as ObjectInstance).referenceId);
            } else {
                this.references.set(ref.cref.ref.name, {
                    name: ref.cref.ref.name,
                    typeId: referenceStorage.resolveReference(ref.cref),
                    referencedIds: [(context.resolve(ref.instance.ref) as ObjectInstance).referenceId]
                });
            }
        }
    }
}

interface AttributeEntry {
    name: string;
    typeId: string;
    value: any;
}

interface ReferenceEntry {
    name: string;
    typeId: string;
    referencedIds: string[];
}
import {
    FunctionCall,
    FunctionMacroCall,
    FunctionStatement,
    IFunction,
    IInstance,
    IMacro,
    InstanceLoop,
    isEnumValueExpr,
    isFunctionAssignment,
    isFunctionCall,
    isFunctionLoop,
    isFunctionMacroCall,
    isFunctionReturn,
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

/**
 * These dataclasses define the structure of the serialized instance output.
 * The instances are being precomputed, all references are resolved and arithmetic expressions evaluated.
 */

function executeMacroCall(macroCall: FunctionMacroCall, referenceStorage: MmlReferenceStorage, outerContext: MmlSerializerContext, serializer: SerializedInstance, instanceRegistry: MmlInstanceRegistry) {
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

function executeFunctionCall(functionCall: FunctionCall, referenceStorage: MmlReferenceStorage, outerContext: MmlSerializerContext, serializer: SerializedInstance, instanceRegistry: MmlInstanceRegistry) {
    const innerContext: MmlSerializerContext = new MmlSerializerContext();
    if (functionCall.func.ref != undefined) {
        const func: IFunction = functionCall.func.ref;
        const zipped = zip(functionCall.args, func.parameter);
        zipped.forEach(value => {
            if (value[0].value != undefined && value[0].ref == undefined) {
                innerContext.storeValue(value[1], outerContext.evaluateArithExpr(value[0].value))
            } else if (value[0].value == undefined && value[0].ref != undefined && value[0].ref.ref != undefined) {
                const passedVariable: Variable = value[0].ref.ref;
                const resolved: any = outerContext.resolve(passedVariable);
                innerContext.storeValue(value[1], resolved);
            }
        });

        for (const stmt of func.statements) {
            if (isFunctionReturn(stmt)) {
                if (stmt.var != undefined && stmt.var.ref != undefined) {
                    innerContext.storeUnbindedValue(innerContext.resolve(stmt.var.ref));
                } else if (stmt.val != undefined) {
                    innerContext.storeUnbindedValue(innerContext.evaluateArithExpr(stmt.val.val));
                }
            } else {
                executeFunctionRecursively(stmt, referenceStorage, innerContext, serializer, instanceRegistry);
            }
        }
    }
    return innerContext;
}

function executeFunctionRecursively(stmt: FunctionStatement, referenceStorage: MmlReferenceStorage, outerContext: MmlSerializerContext, serializer: SerializedInstance, instanceRegistry: MmlInstanceRegistry) {
    if (isFunctionAssignment(stmt)) {
        if (isFunctionCall(stmt.call)) {
            const innerContext: MmlSerializerContext = executeFunctionCall(stmt.call, referenceStorage, outerContext, serializer, instanceRegistry);
            if (stmt.call.func.ref != undefined && stmt.call.func.ref.returnsVar) {
                outerContext.storeValue(stmt.var, innerContext.resolveUnbindedValue());
            }
        } else if (isFunctionMacroCall(stmt.call)) {
            const innerContext: MmlSerializerContext = executeMacroCall(stmt.call, referenceStorage, outerContext, serializer, instanceRegistry);
            if (stmt.select != undefined && stmt.select.ref != undefined) {
                outerContext.storeValue(stmt.var, innerContext.resolve(stmt.select.ref));
            } else {
                outerContext.storeValue(stmt.var, innerContext);
            }
        }
    } else if (isFunctionLoop(stmt)) {
        for (let i = stmt.lower; i < stmt.upper; i++) {
            const newContext: MmlSerializerContext = outerContext.clone();
            newContext.storeValue(stmt.var, i);
            stmt.statements.forEach(loopStmt => executeFunctionRecursively(loopStmt, referenceStorage, newContext, serializer, instanceRegistry));
            newContext.unsetValue(stmt.var);
            //outerContext.enhance(newContext);
        }
    } else if (isFunctionCall(stmt)) {
        executeFunctionCall(stmt, referenceStorage, outerContext, serializer, instanceRegistry);
    } else if (isFunctionMacroCall(stmt)) {
        executeMacroCall(stmt, referenceStorage, outerContext, serializer, instanceRegistry);
    }
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

    private executeRecursively(stmts: (InstanceLoop | FunctionStatement)[], referenceStorage: MmlReferenceStorage, outerContext: MmlSerializerContext, instanceRegistry: MmlInstanceRegistry) {
        stmts.forEach(iStmt => {
            if (isInstanceStatement(iStmt)) {
                if (isFunctionAssignment(iStmt)) {
                    if (isFunctionMacroCall(iStmt.call)) {
                        const innerContext = executeMacroCall(iStmt.call, referenceStorage, outerContext, this, instanceRegistry);
                        if (iStmt.select != undefined && iStmt.select.ref != undefined) {
                            outerContext.storeValue(iStmt.var, innerContext.resolve(iStmt.select.ref));
                        } else {
                            outerContext.storeValue(iStmt.var, innerContext);
                        }
                    } else if (isFunctionCall(iStmt.call)) {
                        const innerContext: MmlSerializerContext = executeFunctionCall(iStmt.call, referenceStorage, outerContext, this, instanceRegistry);
                        if (iStmt.call.func.ref != undefined && iStmt.call.func.ref.returnsVar) {
                            outerContext.storeValue(iStmt.var, innerContext.resolveUnbindedValue());
                        }
                    }
                } else if (isFunctionMacroCall(iStmt)) {
                    executeMacroCall(iStmt, referenceStorage, outerContext, this, instanceRegistry);
                } else if (isFunctionCall(iStmt)) {
                    executeFunctionCall(iStmt, referenceStorage, outerContext, this, instanceRegistry);
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
                        //outerContext.enhance(newContext);
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
            var val;
            var isEnumType = false;
            if (isEnumValueExpr(attr.value) && attr.value.val.ref != undefined) {
                val = referenceStorage.getNodeReferenceId(attr.value.val.ref)
                isEnumType = true;
            } else {
                val = context.evaluateArithExpr(attr.value);
            }
            this.attributes.set(attr.attr.ref.name, {
                name: attr.attr.ref.name,
                typeId: referenceStorage.resolveReference(attr.attr),
                isEnumType: isEnumType,
                value: val
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
    isEnumType: boolean
    value: any;
}

interface ReferenceEntry {
    name: string;
    typeId: string;
    referencedIds: string[];
}
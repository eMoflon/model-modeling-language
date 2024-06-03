import {
    Attribute,
    Class,
    CReference,
    Interface,
    isAttribute,
    isClass,
    isCReference,
    isInterface
} from "./generated/ast.js";
import {AstNode, AstNodeDescription, AstNodeDescriptionProvider, EMPTY_SCOPE, Scope, stream, Stream} from "langium";

export class ScopingUtils {
    public static getAllInheritedAttributes(aclass: Class | Interface): Attribute[] {
        let combinedResult: Attribute[] = [];
        if (isClass(aclass)) {
            aclass.body.forEach(stmt => {
                if (isAttribute(stmt)) {
                    combinedResult.push(stmt);
                }
            });
            aclass.extendedClasses.forEach(extClass => {
                if (extClass.ref != undefined) {
                    combinedResult.push(...this.getAllInheritedAttributes(extClass.ref))
                }
            });
            aclass.implementedInterfaces.forEach(implInterface => {
                if (implInterface.ref != undefined) {
                    combinedResult.push(...this.getAllInheritedAttributes(implInterface.ref))
                }
            });
        } else if (isInterface(aclass)) {
            aclass.body.forEach(stmt => {
                if (isAttribute(stmt)) {
                    combinedResult.push(stmt);
                }
            });
            aclass.extendedInterfaces.forEach(implInterface => {
                if (implInterface.ref != undefined) {
                    combinedResult.push(...this.getAllInheritedAttributes(implInterface.ref))
                }
            });
        }
        return combinedResult;
    }

    public static getAllInheritedReferences(aclass: Class | Interface): CReference[] {
        let combinedResult: CReference[] = [];
        if (isClass(aclass)) {
            aclass.body.forEach(stmt => {
                if (isCReference(stmt)) {
                    combinedResult.push(stmt);
                }
            });
            aclass.extendedClasses.forEach(extClass => {
                if (extClass.ref != undefined) {
                    combinedResult.push(...this.getAllInheritedReferences(extClass.ref))
                }
            });
            aclass.implementedInterfaces.forEach(implInterface => {
                if (implInterface.ref != undefined) {
                    combinedResult.push(...this.getAllInheritedReferences(implInterface.ref))
                }
            });
        } else if (isInterface(aclass)) {
            aclass.body.forEach(stmt => {
                if (isCReference(stmt)) {
                    combinedResult.push(stmt);
                }
            });
            aclass.extendedInterfaces.forEach(implInterface => {
                if (implInterface.ref != undefined) {
                    combinedResult.push(...this.getAllInheritedReferences(implInterface.ref))
                }
            });
        }
        return combinedResult;
    }

    public static getAllInheritedAbstractElements(element: Class | Interface): Set<(Class | Interface)> {
        const elements: Set<(Class | Interface)> = new Set([element]);
        if (isClass(element)) {
            element.extendedClasses.forEach(extendedClass => {
                if (extendedClass != undefined && extendedClass.ref != undefined) {
                    this.getAllInheritedAbstractElements(extendedClass.ref).forEach(el => elements.add(el));
                }
            })
            element.implementedInterfaces.forEach(implementedInterface => {
                if (implementedInterface != undefined && implementedInterface.ref != undefined) {
                    this.getAllInheritedAbstractElements(implementedInterface.ref).forEach(el => elements.add(el));
                }
            })
        } else if (isInterface(element)) {
            element.extendedInterfaces.forEach(extendedInterface => {
                if (extendedInterface != undefined && extendedInterface.ref != undefined) {
                    this.getAllInheritedAbstractElements(extendedInterface.ref).forEach(el => elements.add(el));
                }
            })
        }

        return elements;
    }

    public static computeCustomScope<A extends AstNode, B extends AstNode>(elements: (A | undefined)[], descriptionProvider: AstNodeDescriptionProvider, nameExtractor: (e: A) => string | undefined, nodeExtractor: (e: A) => B, scopeGenerator: (elements: Iterable<AstNodeDescription>, outerScope?: Scope | undefined) => Scope): Scope {
        const scopes: Array<Stream<AstNodeDescription>> = [];
        scopes.push(this.createScopeElementStream(elements, descriptionProvider, nameExtractor, nodeExtractor));
        return this.buildScopeFromAstNodeDesc(scopes, scopeGenerator);
    }

    public static createScopeElementStream<A extends AstNode, B extends AstNode>(elements: (A | undefined)[], descriptionProvider: AstNodeDescriptionProvider, nameExtractor: (e: A) => string | undefined, nodeExtractor: (e: A) => B): Stream<AstNodeDescription> {
        return stream(elements.map((v: A | undefined) => {
            if (v != undefined) {
                const name = nameExtractor(v);
                if (name != undefined) {
                    return descriptionProvider.createDescription(nodeExtractor(v), name);
                }
            }
            return undefined;
        })).filter(d => d != undefined) as Stream<AstNodeDescription>;
    }

    public static buildScopeFromAstNodeDesc(nodeDescStream: Array<Stream<AstNodeDescription>>, scopeGenerator: (elements: Iterable<AstNodeDescription>, outerScope?: Scope | undefined) => Scope): Scope {
        let result = EMPTY_SCOPE;
        for (let i = nodeDescStream.length - 1; i >= 0; i--) {
            result = scopeGenerator(nodeDescStream[i], result);
        }
        return result;
    }
}
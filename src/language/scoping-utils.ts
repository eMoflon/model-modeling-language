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
}
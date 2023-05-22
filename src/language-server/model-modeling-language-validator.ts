import {ValidationAcceptor, ValidationChecks} from 'langium';
import {
    Attribute,
    Class,
    CReference,
    Enum,
    Interface,
    isBoolExpr,
    isModel,
    isNumberExpr,
    isStringExpr,
    Model,
    ModelModelingLanguageAstType,
    Package
} from './generated/ast';
import type {ModelModelingLanguageServices} from './model-modeling-language-module';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ModelModelingLanguageServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.ModelModelingLanguageValidator;
    const checks: ValidationChecks<ModelModelingLanguageAstType> = {
        Package: [
            validator.checkUniqueElementNames
        ],
        Interface: [
            validator.checkUniqueInterfaceStmtNames,
            validator.checkInterfaceImports,
            validator.checkInterfaceExtends
        ],
        Class: [
            validator.checkUniqueClassStmtNames,
            validator.checkClassImports,
            validator.checkClassExtends,
            validator.checkClassImplements
        ],
        Model: [
            validator.checkUniqueImports
        ],
        CReference: [
            validator.checkCReferenceImports,
            validator.checkMissingOppositeAnnotation,
            validator.checkNonMatchingOppositeAnnotation
        ],
        Attribute: [
            validator.checkAttributeTypes
        ],
        Enum: [
            validator.checkUniqueEnumType
        ]
    };
    registry.register(checks, validator);
}

export namespace IssueCodes {
    export const ImportAlreadyExists = "import-already-exists";
    export const ImportIsMissing = "import-is-missing";
    export const AttributeTypeDoesNotMatch = "attribute-type-does-not-match";
    export const OppositeAnnotationMissing = "opposite-annotation-missing";
    export const OppositesOppositeAnnotationMissing = "opposites-opposite-annotation-missing";
    export const DuplicateClassExtension = "class-extension-duplicate";
    export const DuplicateClassImplements = "class-implements-duplicate";
    export const DuplicateInterfaceExtension = "interface-extension-duplicate";
    export const InterfaceSelfExtension = "interface-self-extension";
    export const ClassSelfExtension = "class-self-extension";
}

/**
 * Implementation of custom validations.
 */
export class ModelModelingLanguageValidator {
    checkUniqueElementNames(pkge: Package, accept: ValidationAcceptor): void {
        const reportedElements = new Set();
        pkge.body.forEach(elmt => {
            if (reportedElements.has(elmt.name)) {
                accept('error', `${elmt.$type} has non-unique name '${elmt.name}'.`, {node: elmt, property: 'name'})
            }
            reportedElements.add(elmt.name);
        });
    }

    checkUniqueClassStmtNames(cls: Class, accept: ValidationAcceptor): void {
        const reportedStmt = new Set();
        cls.body.forEach(stmt => {
            if (reportedStmt.has(stmt.name)) {
                accept('error', `Class has non-unique name '${stmt.name}'.`, {node: stmt, property: 'name'})
            }
            reportedStmt.add(stmt.name);
        });
    }

    checkUniqueInterfaceStmtNames(intf: Interface, accept: ValidationAcceptor): void {
        const reportedStmt = new Set();
        intf.body.forEach(stmt => {
            if (reportedStmt.has(stmt.name)) {
                accept('error', `${stmt.$type} has non-unique name '${stmt.name}'.`, {node: stmt, property: 'name'})
            }
            reportedStmt.add(stmt.name);
        });
    }

    checkUniqueImports(modl: Model, accept: ValidationAcceptor): void {
        const reportedImports = new Set();
        modl.imports.forEach(imrt => {
            if (reportedImports.has(imrt.target)) {
                accept('error', `${imrt.target} is already imported'.`, {
                    node: imrt,
                    code: IssueCodes.ImportAlreadyExists
                })
            }
            reportedImports.add(imrt.target);
        });
    }

    checkClassImports(cls: Class, accept: ValidationAcceptor): void {
        let ctnr: Package | Model = cls.$container;
        while (!isModel(ctnr)) {
            ctnr = ctnr.$container;
        }

        const documentURI = ctnr.$document?.uri;

        let importedDocuments = new Set((ctnr as Model).imports.map(imprt => imprt.target));

        cls.extendedClasses.forEach(extCls => {
            const extClassUri = extCls.$nodeDescription?.documentUri;
            if (documentURI == undefined || extClassUri == undefined) {
                console.error("Undefined class path!");
            } else {
                if (extClassUri.path != documentURI.path) {
                    if (!importedDocuments.has(extClassUri.path)) {
                        accept('error', `${extCls.ref?.name} with path ${extClassUri.path} is not imported'.`, {
                            node: cls,
                            property: 'extendedClasses',
                            code: IssueCodes.ImportIsMissing
                        })
                    }
                }
            }
        })

        cls.implementedInterfaces.forEach(implIntrfc => {
            const implIntrfcUri = implIntrfc.$nodeDescription?.documentUri;
            if (documentURI == undefined || implIntrfcUri == undefined) {
                console.error("Undefined class path!");
            } else {
                if (implIntrfcUri.path != documentURI.path) {
                    if (!importedDocuments.has(implIntrfcUri.path)) {
                        accept('error', `${implIntrfc.ref?.name} with path ${implIntrfcUri.path} is not imported'.`, {
                            node: cls,
                            property: 'implementedInterfaces',
                            code: IssueCodes.ImportIsMissing
                        })
                    }
                }
            }
        })
    }

    checkInterfaceImports(intrfc: Interface, accept: ValidationAcceptor): void {
        let ctnr: Package | Model = intrfc.$container;
        while (!isModel(ctnr)) {
            ctnr = ctnr.$container;
        }

        const documentURI = ctnr.$document?.uri;

        let importedDocuments = new Set((ctnr as Model).imports.map(imprt => imprt.target));

        intrfc.extendedInterfaces.forEach(extIntrfc => {
            const extIntrfcUri = extIntrfc.$nodeDescription?.documentUri;
            if (documentURI == undefined || extIntrfcUri == undefined) {
                console.error("Undefined interface path!");
            } else {
                if (extIntrfcUri.path != documentURI.path) {
                    if (!importedDocuments.has(extIntrfcUri.path)) {
                        accept('error', `${extIntrfc.ref?.name} with path ${extIntrfcUri.path} is not imported'.`, {
                            node: intrfc,
                            property: 'extendedInterfaces'
                        })
                    }
                }
            }
        })
    }

    checkCReferenceImports(ref: CReference, accept: ValidationAcceptor): void {
        let ctnr: Class | Interface | Package | Model = ref.$container;
        while (!isModel(ctnr)) {
            ctnr = ctnr.$container;
        }

        const documentURI = (ctnr as Model).$document?.uri;

        let importedDocuments = new Set((ctnr as Model).imports.map(imprt => imprt.target));

        const refTypeUri = ref.type.$nodeDescription?.documentUri;
        if (documentURI == undefined || refTypeUri == undefined) {
            console.error("Undefined interface path!");
        } else {
            if (refTypeUri.path != documentURI.path) {
                if (!importedDocuments.has(refTypeUri.path)) {
                    accept('error', `${ref.type.ref?.name} with path ${refTypeUri.path} is not imported'.`, {
                        node: ref,
                        property: 'type'
                    })
                }
            }
        }

        if (ref.opposite != undefined) {
            const oppositeTypeUri = ref.opposite.reference.$nodeDescription?.documentUri;
            if (documentURI == undefined || oppositeTypeUri == undefined) {
                console.error("Undefined interface path!");
            } else {
                if (oppositeTypeUri.path != documentURI.path) {
                    if (!importedDocuments.has(oppositeTypeUri.path)) {
                        accept('error', `${ref.opposite.reference.ref?.name} with path ${oppositeTypeUri.path} is not imported'.`, {
                            node: ref.opposite,
                            property: 'reference'
                        })
                    }
                }
            }
        }
    }

    checkAttributeTypes(attr: Attribute, accept: ValidationAcceptor) {
        let targetType = undefined;
        switch (attr.type) {
            case "bool":
                targetType = "boolean";
                break;
            case "string":
                targetType = "string";
                break;
            case "double":
            case "int":
            case "float":
                targetType = "number";
                break;
        }
        if (targetType != undefined && attr.defaultValue != undefined) {
            let defaultValueType = undefined;
            if (isStringExpr(attr.defaultValue)) {
                defaultValueType = "string";
            } else if (isNumberExpr(attr.defaultValue)) {
                defaultValueType = "number";
            } else if (isBoolExpr(attr.defaultValue)) {
                defaultValueType = "boolean";
            }
            if (defaultValueType != targetType) {
                accept('error', `Default value of type ${defaultValueType} does not match specified attribute type (${attr.type})`, {
                    node: attr,
                    property: 'type',
                    code: IssueCodes.AttributeTypeDoesNotMatch
                })
            }
        }
    }

    checkMissingOppositeAnnotation(cref: CReference, accept: ValidationAcceptor) {
        if (cref.opposite == null) {
            accept('hint', `Reference opposite is not defined!`, {
                node: cref,
                property: 'name',
                code: IssueCodes.OppositeAnnotationMissing
            })
        }
    }

    checkNonMatchingOppositeAnnotation(cref: CReference, accept: ValidationAcceptor) {
        if (cref.opposite != null && cref.opposite.reference != null && cref.opposite.reference.ref != null) {
            const oppositeRef = cref.opposite.reference.ref;
            if (oppositeRef.opposite == null) {
                accept('error', `Reference opposite has no opposite defined!`, {
                    node: cref,
                    property: 'opposite',
                    code: IssueCodes.OppositesOppositeAnnotationMissing
                })
            }
            if (oppositeRef.opposite != null && oppositeRef.opposite.reference != null && oppositeRef.opposite.reference.ref != null) {
                if (oppositeRef.opposite.reference.ref != cref) {
                    accept('error', `Reference opposite does not match!`, {
                        node: cref,
                        property: 'opposite'
                    })
                }
            }
        }
    }

    checkInterfaceExtends(intf: Interface, accept: ValidationAcceptor) {
        const knownInterfaces = new Set();
        intf.extendedInterfaces.forEach((eIntf, idx) => {
            if (eIntf.ref != undefined) {
                if (eIntf.ref == intf) {
                    accept('error', `This interface cannot extend itself!`, {
                        node: intf,
                        property: 'extendedInterfaces',
                        index: idx,
                        code: IssueCodes.InterfaceSelfExtension
                    })
                } else {
                    if (knownInterfaces.has(eIntf.ref)) {
                        accept('error', `This interface is already extended!`, {
                            node: intf,
                            property: 'extendedInterfaces',
                            index: idx,
                            code: IssueCodes.DuplicateInterfaceExtension
                        })
                    } else {
                        knownInterfaces.add(eIntf.ref);
                    }
                }
            }
        })
    }

    checkClassExtends(cls: Class, accept: ValidationAcceptor) {
        const knownClasses = new Set();
        cls.extendedClasses.forEach((eCls, idx) => {
            if (eCls.ref != undefined) {
                if (eCls.ref == cls) {
                    accept('error', `This class cannot extend itself!`, {
                        node: cls,
                        property: 'extendedClasses',
                        index: idx,
                        code: IssueCodes.ClassSelfExtension
                    })
                } else {
                    if (knownClasses.has(eCls.ref)) {
                        accept('error', `This class is already extended!`, {
                            node: cls,
                            property: 'extendedClasses',
                            index: idx,
                            code: IssueCodes.DuplicateClassExtension
                        })
                    } else {
                        knownClasses.add(eCls.ref);
                    }
                }
            }
        })
    }

    checkClassImplements(cls: Class, accept: ValidationAcceptor) {
        const knownInterfaces = new Set();
        cls.implementedInterfaces.forEach((iIntf, idx) => {
            if (iIntf.ref != undefined) {
                if (knownInterfaces.has(iIntf.ref)) {
                    accept('error', `This interface is already implemented!`, {
                        node: cls,
                        property: 'extendedClasses',
                        index: idx,
                        code: IssueCodes.DuplicateClassImplements
                    })
                } else {
                    knownInterfaces.add(iIntf.ref);
                }
            }
        })
    }

    checkUniqueEnumType(enm: Enum, accept: ValidationAcceptor) {
        const usedTypes = new Set();
        enm.entries.forEach(entry => {
            if (entry.value != undefined) {
                usedTypes.add(entry.value.$type);
            }
        })
        if (usedTypes.size > 1) {
            accept('error', `Enum has no unique type. Each enum element must have the same type!`, {
                node: enm,
                property: 'name'
            })
        }
    }
}

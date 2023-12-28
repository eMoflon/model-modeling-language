import {AstNode, getDocument, LangiumDocument, ValidationAcceptor, ValidationChecks} from 'langium';
import {
    AbstractElement,
    ArithExpr,
    Attribute,
    Class,
    CReference,
    Enum,
    EnumEntry,
    EnumValueExpr,
    FunctionAssignment,
    FunctionCall,
    FunctionLoop,
    FunctionMacroCall,
    FunctionVariableSelectorExpr,
    IFunction,
    IMacro,
    Import,
    InstanceLoop,
    Interface,
    isBinaryExpression,
    isClass,
    isEnum,
    isEnumValueExpr,
    isFunctionCall,
    isFunctionMacroCall,
    isFunctionReturn,
    isFunctionStatement,
    isFunctionVariable,
    isFunctionVariableSelectorExpr,
    isInterface,
    isModel,
    isVariableValueExpr,
    MacroAssignStatement,
    MacroAttributeStatement,
    MacroInstance,
    Model,
    ModelModelingLanguageAstType,
    Multiplicity,
    Package,
    TypedVariable,
    VariableType
} from './generated/ast.js';
import type {ModelModelingLanguageServices} from './model-modeling-language-module.js';
import {URI} from "vscode-uri";
import {ModelModelingLanguageUtils} from "./model-modeling-language-utils.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ModelModelingLanguageServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.ModelModelingLanguageValidator;
    const checks: ValidationChecks<ModelModelingLanguageAstType> = {
        Package: [
            validator.checkUniqueElementNames,
            validator.checkUniqueSubPackageNames
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
            validator.checkUniqueImports,
            validator.checkUniquePackageNames,
            validator.checkUniqueAliases,
            validator.checkPackageShadowing,
            validator.checkUniqueMacroNames,
            validator.checkUniqueFunctionNames,
            validator.checkUniqueInstanceNames
        ],
        Multiplicity: [
            validator.checkMultiplicities
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
        ],
        Import: [
            validator.checkSelfImport,
            validator.checkImportAliasRefsContained
        ],
        IMacro: [
            validator.checkUniqueMacroVariableNames
        ],
        MacroInstance: [
            validator.checkMacroInstanceInstanciator
        ],
        MacroAttributeStatement: [
            validator.checkMacroAttributeStatementType
        ],
        MacroAssignStatement: [
            validator.checkMacroAssignStatementType
        ],
        IFunction: [
            validator.checkUniqueFunctionVariableNames,
            validator.checkFunctionReturnConfiguration
        ],
        FunctionMacroCall: [
            validator.checkFunctionMacroCallArguments
        ],
        FunctionCall: [
            validator.checkFunctionCallArguments
        ],
        FunctionAssignment: [
            validator.checkFunctionAssignment
        ],
        FunctionLoop: [
            validator.checkFunctionLoops
        ],
        InstanceLoop: [
            validator.checkInstanceLoops
        ],
        ArithExpr: [
            validator.checkArithExprOperations
        ],
        FunctionVariableSelectorExpr: [
            validator.checkFunctionArgumentSelector
        ]
    };
    registry.register(checks, validator);
}

/**
 * Register issue codes, which are used to attach code actions.
 */
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
    export const PackageNameNotUnique = "package-name-not-unique";
    export const SubPackageNameNotUnique = "subpackage-name-not-unique";
    export const ElementNameNotUnique = "element-name-not-unique";
    export const ClassStatementNameNotUnique = "class-statement-name-not-unique";
    export const InterfaceStatementNameNotUnique = "interface-statement-name-not-unique";
    export const InvalidMultiplicity = "invalid-multiplicity";
    export const OppositeAnnotationDoesNotMatch = "opposite-annotation-does-not-match";
    export const EnumTypeNotUnique = "enum-type-not-unique";
    export const AliasNotUnique = "alias-not-unique";
    export const AliasShadowsPackage = "alias-shadows-package";
    export const UnknownDocument = "unknown-document";
    export const ImportedDocumentShadowsPackages = "imported-document-shadows-package";
    export const SelfImport = "self-import";
    export const AliasReferencesUnknownPackage = "alias-references-unknown-package";
    export const MacroAttributeTypeDoesNotMatch = "macro-attribute-type-does-not-match";
    export const MacroAssignReferenceTypeDoesNotMatch = "macro-assignment-type-does-not-match";
    export const MacroNameNotUnique = "macro-name-not-unique";
    export const MacroVariableNameNotUnique = "macro-variable-name-not-unique";
    export const FunctionNameNotUnique = "function-name-not-unique";
    export const FunctionVariableNameNotUnique = "function-variable-name-not-unique";
    export const FunctionMacroCallArgumentLengthMismatch = "function-macro-call-argument-length-mismatch";
    export const FunctionMacroCallArgumentTypeMismatch = "function-macro-call-argument-type-mismatch";
    export const FunctionCallArgumentLengthMismatch = "function-call-argument-length-mismatch";
    export const FunctionCallArgumentTypeMismatch = "function-call-argument-type-mismatch";
    export const FunctionReturnSignatureTypeMismatch = "function-return-signature-type-mismatch";
    export const FunctionReturnStatementMissing = "function-return-statement-missing";
    export const FunctionReturnTypeSignatureMissing = "function-return-type-signature-missing";
    export const FunctionAssignmentTupleHandlingMismatch = "function-assignment-tuple-handling-mismatch";
    export const FunctionAssignmentTypeMismatch = "function-assignment-type-mismatch";
    export const FunctionAssignmentWithVoidFunction = "function-assignment-with-void-function";
    export const FunctionLoopBoundaryMismatch = "function-loop-boundary-mismatch";
    export const InstanceNameNotUnique = "instance-name-not-unique";
    export const InstanceLoopTypeMismatch = "instance-loop-type-mismatch";
    export const ArithExpressionUnsupportedOperation = "arith-expression-unsupported-operation";
    export const InvalidTupleSelectorInParameter = "invalid-tuple-selector-in-parameter";
    export const InstantiationOfInterface = "instantiation-of-interface";
    export const InstantiationOfAbstractClass = "instantiation-of-abstract-class";
    export const InstantiationOfEnum = "instantiation-of-enum";
    export const InstantiationOfPrimitiveType = "instantiation-of-primitive-type";
}

/**
 * Implementation of custom validations.
 */
export class ModelModelingLanguageValidator {
    services: ModelModelingLanguageServices;

    constructor(services: ModelModelingLanguageServices) {
        this.services = services;
    }

    checkUniquePackageNames(modl: Model, accept: ValidationAcceptor): void {
        const reportedElements = new Set();
        modl.packages.forEach(pckg => {
            if (reportedElements.has(pckg.name)) {
                accept('error', `${pckg.$type} has non-unique name '${pckg.name}'.`, {
                    node: pckg,
                    property: 'name',
                    code: IssueCodes.PackageNameNotUnique
                })
            }
            reportedElements.add(pckg.name);
        });
    }

    checkUniqueSubPackageNames(pckg: Package, accept: ValidationAcceptor): void {
        const reportedElements = new Set();
        pckg.subPackages.forEach(subPckg => {
            if (reportedElements.has(subPckg.name)) {
                accept('error', `${subPckg.$type} has non-unique name '${subPckg.name}'.`, {
                    node: subPckg,
                    property: 'name',
                    code: IssueCodes.SubPackageNameNotUnique
                })
            }
            reportedElements.add(subPckg.name);
        });
    }

    checkUniqueElementNames(pkge: Package, accept: ValidationAcceptor): void {
        const reportedElements = new Set();
        pkge.body.forEach(elmt => {
            if (reportedElements.has(elmt.name)) {
                accept('error', `${elmt.$type} has non-unique name '${elmt.name}'.`, {
                    node: elmt,
                    property: 'name',
                    code: IssueCodes.ElementNameNotUnique
                })
            }
            reportedElements.add(elmt.name);
        });
    }

    checkUniqueClassStmtNames(cls: Class, accept: ValidationAcceptor): void {
        const reportedStmt = new Set();
        cls.body.forEach(stmt => {
            if (reportedStmt.has(stmt.name)) {
                accept('error', `${stmt.$type} has non-unique name '${stmt.name}'.`, {
                    node: stmt,
                    property: 'name',
                    code: IssueCodes.ClassStatementNameNotUnique
                })
            }
            reportedStmt.add(stmt.name);
        });
    }

    checkUniqueInterfaceStmtNames(intf: Interface, accept: ValidationAcceptor): void {
        const reportedStmt = new Set();
        intf.body.forEach(stmt => {
            if (reportedStmt.has(stmt.name)) {
                accept('error', `${stmt.$type} has non-unique name '${stmt.name}'.`, {
                    node: stmt,
                    property: 'name',
                    code: IssueCodes.InterfaceStatementNameNotUnique
                })
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
                            property: 'extendedInterfaces',
                            code: IssueCodes.ImportIsMissing
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
                        property: 'type',
                        code: IssueCodes.ImportIsMissing
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
                            property: 'reference',
                            code: IssueCodes.ImportIsMissing
                        })
                    }
                }
            }
        }
    }

    checkMultiplicities(mult: Multiplicity, accept: ValidationAcceptor) {
        if (mult != undefined) {
            const lowerSpec = mult.mult;
            if (mult.upperMult != undefined) {
                const upperSpec = mult.upperMult;
                if (lowerSpec.n_0 || lowerSpec.n) {
                    accept('error', `Lower bound cannot be unspecified when upper bound given`, {
                        node: mult.mult,
                        code: IssueCodes.InvalidMultiplicity
                    })
                }
                if (!lowerSpec.n_0 && !lowerSpec.n && !upperSpec.n_0 && !upperSpec.n && lowerSpec.num != undefined && upperSpec.num && lowerSpec.num > upperSpec.num) {
                    accept('error', `Lower bound cannot be greater then upper bound (${lowerSpec.num} > ${upperSpec.num})`, {
                        node: mult.mult,
                        code: IssueCodes.InvalidMultiplicity
                    })
                }
            }
        }

    }

    checkAttributeTypes(attr: Attribute, accept: ValidationAcceptor) {
        if (attr.defaultValue != undefined) {
            // attribute has default value
            if (attr.type.ptype != undefined && attr.type.etype == undefined) {
                // attribute has primitive type, not enum type
                if (attr.type.ptype == "bool" && !ModelModelingLanguageUtils.isBoolArithExpr(attr.defaultValue)) {
                    // bool type but default value is not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: attr,
                        property: 'type',
                        code: IssueCodes.AttributeTypeDoesNotMatch
                    })
                } else if (attr.type.ptype == "string" && !ModelModelingLanguageUtils.isStringArithExpr(attr.defaultValue)) {
                    // string type but default value is not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: attr,
                        property: 'type',
                        code: IssueCodes.AttributeTypeDoesNotMatch
                    })
                } else if (attr.type.ptype == "int" && !ModelModelingLanguageUtils.isIntArithExpr(attr.defaultValue)) {
                    // int type but default value is not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: attr,
                        property: 'type',
                        code: IssueCodes.AttributeTypeDoesNotMatch
                    })
                } else if ((attr.type.ptype == "double" || attr.type.ptype == "float") && !ModelModelingLanguageUtils.isNumberArithExpr(attr.defaultValue)) {
                    // number type but default value is not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: attr,
                        property: 'type',
                        code: IssueCodes.AttributeTypeDoesNotMatch
                    })
                }
            } else if (attr.type.ptype == undefined && attr.type.etype != undefined && attr.type.etype.ref != undefined && !ModelModelingLanguageUtils.isEnumValueArithExpr(attr.defaultValue)) {
                // attribute has enum type, not primitive type, but default value is no enum value
                accept('error', `Default value does not match specified attribute type (${ModelModelingLanguageUtils.getQualifiedClassName(attr.type.etype.ref, attr.type.etype.ref.name)})`, {
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
                        property: 'opposite',
                        code: IssueCodes.OppositeAnnotationDoesNotMatch
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
                property: 'name',
                code: IssueCodes.EnumTypeNotUnique
            })
        }
    }

    checkUniqueAliases(modl: Model, accept: ValidationAcceptor) {
        const knownAliases = new Set();
        const knownSuperPackages = new Set(modl.packages.map(p => p.name));
        modl.imports.forEach(ip => {
            ip.aliases.forEach((ipas, idx) => {
                if (knownAliases.has(ipas.alias)) {
                    accept('error', `This alias is already in use!`, {
                        node: ipas,
                        index: idx,
                        property: 'alias',
                        code: IssueCodes.AliasNotUnique
                    })
                } else if (knownSuperPackages.has(ipas.alias)) {
                    accept('error', `This alias shadows a package name in this file!`, {
                        node: ipas,
                        index: idx,
                        property: 'alias',
                        code: IssueCodes.AliasShadowsPackage
                    })
                } else {
                    knownAliases.add(ipas.alias);
                }
            })
        })
    }

    checkPackageShadowing(modl: Model, accept: ValidationAcceptor) {
        const shadowedPackageNames: Set<string> = new Set(modl.packages.map(p => p.name));
        modl.imports.forEach(ip => {
            const importedDocURI: URI = URI.parse(ip.target);
            const docShadowedPackageNames: Set<string> = new Set();
            if (this.services.shared.workspace.LangiumDocuments.hasDocument(importedDocURI)) {
                const importedDocument: LangiumDocument = this.services.shared.workspace.LangiumDocuments.getOrCreateDocument(importedDocURI);
                const importedRoot: Model = importedDocument.parseResult.value as Model;
                importedRoot.packages.forEach(pk => {
                    if (shadowedPackageNames.has(pk.name)) {
                        docShadowedPackageNames.add(pk.name);
                    }
                    shadowedPackageNames.add(pk.name);
                });
                if (docShadowedPackageNames.size > 0) {
                    accept('error', `Imported document shadows the following package names: [${[...docShadowedPackageNames].join(', ')}]`, {
                        node: ip,
                        property: 'target',
                        code: IssueCodes.ImportedDocumentShadowsPackages
                    })
                }
            } else {
                accept('error', `Document currently not managed by langium services`, {
                    node: ip,
                    property: 'target',
                    code: IssueCodes.UnknownDocument
                })
            }
        })
    }

    checkSelfImport(ip: Import, accept: ValidationAcceptor) {
        const targetPath = ip.target;
        if (targetPath == getDocument(ip).uri.path) {
            accept('error', `Document imports itself!`, {
                node: ip,
                property: 'target',
                code: IssueCodes.SelfImport
            })
        }
    }

    checkImportAliasRefsContained(ip: Import, accept: ValidationAcceptor) {
        const importedDocURI: URI = URI.parse(ip.target);
        ip.aliases.forEach((ipa, idx) => {
            if (ipa.ref.$nodeDescription != undefined) {
                if (ipa.ref.$nodeDescription.documentUri != undefined) {
                    if (ipa.ref.$nodeDescription.documentUri.path != importedDocURI.path) {
                        accept('error', `Package ${ipa.ref.$refText} is not defined in this document!`, {
                            node: ip,
                            property: 'aliases',
                            index: idx,
                            code: IssueCodes.AliasReferencesUnknownPackage
                        })
                    }
                } else {
                    console.error("[AliasRefsCheck] NodeDescription is undefined!");
                }
            }
        });
    }

    checkMacroAttributeStatementType(mas: MacroAttributeStatement, accept: ValidationAcceptor) {
        const attr = mas.attr.ref;
        if (attr != undefined && mas.value != undefined) {
            // both sides of statement are not undefined
            if (attr.type.ptype != undefined && attr.type.etype == undefined) {
                // attribute has primitive datatype, not enum type
                if (isVariableValueExpr(mas.value) && mas.value.val.ref != undefined) {
                    // value is known variable
                    if (attr.type.ptype != ModelModelingLanguageUtils.getVariableTyping(mas.value.val.ref).dtype) {
                        // typing of variable does not match the defined attribute type
                        accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                            node: mas,
                            property: "value",
                            code: IssueCodes.MacroAttributeTypeDoesNotMatch
                        });
                    }
                } else if (attr.type.ptype == "bool" && !ModelModelingLanguageUtils.isBoolArithExpr(mas.value)) {
                    // attribute has bool type but value has not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: mas,
                        property: "value",
                        code: IssueCodes.MacroAttributeTypeDoesNotMatch
                    });
                } else if (attr.type.ptype == "string" && !ModelModelingLanguageUtils.isStringArithExpr(mas.value)) {
                    // attribute has string type but value has not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: mas,
                        property: "value",
                        code: IssueCodes.MacroAttributeTypeDoesNotMatch
                    });
                } else if (attr.type.ptype == "int" && !ModelModelingLanguageUtils.isIntArithExpr(mas.value)) {
                    // attribute has int type but value has not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: mas,
                        property: "value",
                        code: IssueCodes.MacroAttributeTypeDoesNotMatch
                    });
                } else if ((attr.type.ptype == "double" || attr.type.ptype == "float") && !ModelModelingLanguageUtils.isNumberArithExpr(mas.value)) {
                    // attribute has number type but value has not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: mas,
                        property: "value",
                        code: IssueCodes.MacroAttributeTypeDoesNotMatch
                    });
                }
            } else if (attr.type.ptype == undefined && attr.type.etype != undefined && attr.type.etype.ref != undefined) {
                // attribute has enum type, not primitive datatype
                if (ModelModelingLanguageUtils.isEnumValueArithExpr(mas.value) && mas.value != undefined && (mas.value as EnumValueExpr).val.ref != undefined) {
                    // value is enum value
                    const attrType: Enum = attr.type.etype.ref;
                    // @ts-ignore
                    const valEntry: EnumEntry = (mas.value as EnumValueExpr).val.ref;
                    const valType: Enum = valEntry.$container;
                    if (attrType != undefined && attrType != valType) {
                        accept('error', `Default value does not match specified attribute type (${ModelModelingLanguageUtils.getQualifiedClassName(attr.type.etype.ref, attr.type.etype.ref.name)})`, {
                            node: mas,
                            property: "value",
                            code: IssueCodes.MacroAttributeTypeDoesNotMatch
                        });
                    }
                } else {
                    // attribute has enum type but provided value is no enum type
                    accept('error', `Default value does not match specified attribute type (${ModelModelingLanguageUtils.getQualifiedClassName(attr.type.etype.ref, attr.type.etype.ref.name)})`, {
                        node: mas,
                        property: "value",
                        code: IssueCodes.MacroAttributeTypeDoesNotMatch
                    });
                }
            }
        }
    }

    checkMacroAssignStatementType(mas: MacroAssignStatement, accept: ValidationAcceptor) {
        if (mas.cref == undefined || mas.instance == undefined) {
            return;
        }
        const targetReference: CReference | undefined = mas.cref.ref;
        const instVar: TypedVariable | undefined = mas.instance.ref;
        if (targetReference != undefined && instVar != undefined) {
            // both references are linked
            if (instVar.typing.dtype != undefined && instVar.typing.type == undefined) {
                // provided value has primitive datatype instead of class type
                accept('error', `A reference cannot point to a variable of type "${instVar.typing.dtype}"!`, {
                    node: mas,
                    property: "instance",
                    code: IssueCodes.MacroAssignReferenceTypeDoesNotMatch
                });
            } else if (instVar.typing.type != undefined) {
                // provided value has class type
                const instVarClss = instVar.typing.type.ref;
                const targetRefTypeClss = targetReference.type.ref;
                if (instVarClss != undefined && targetRefTypeClss != undefined) {
                    // both references are linked
                    if (targetRefTypeClss != instVarClss && !ModelModelingLanguageUtils.getAllInheritedAbstractElements(instVarClss).includes(targetRefTypeClss)) {
                        // required and provided class types do not match and inheritance is also not given
                        const qcn1 = ModelModelingLanguageUtils.getQualifiedClassName(targetRefTypeClss, targetRefTypeClss.name);
                        const qcn2 = ModelModelingLanguageUtils.getQualifiedClassName(instVarClss, instVarClss.name);
                        accept('error', `Non-matching types, a reference of type "${qcn1}" cannot have a class of type "${qcn2}"!`, {
                            node: mas,
                            property: "instance",
                            code: IssueCodes.MacroAssignReferenceTypeDoesNotMatch
                        });
                    }
                }
            }
        }
    }

    checkUniqueMacroNames(mdl: Model, accept: ValidationAcceptor) {
        const reportedMacros = new Set();
        mdl.macros.forEach(mcr => {
            if (reportedMacros.has(mcr.name)) {
                accept('error', `Macro has non-unique name '${mcr.name}'.`, {
                    node: mcr,
                    property: 'name',
                    code: IssueCodes.MacroNameNotUnique
                });
            }
            reportedMacros.add(mcr.name);
        });
    }

    checkUniqueMacroVariableNames(macro: IMacro, accept: ValidationAcceptor): void {
        const reportedVars = new Set();
        const reportedInstNames = new Set();
        macro.parameter.forEach(param => {
            if (reportedVars.has(param.name)) {
                accept('error', `Macro parameter has non-unique name '${param.name}'.`, {
                    node: param,
                    property: 'name',
                    code: IssueCodes.MacroVariableNameNotUnique
                })
            }
            reportedVars.add(param.name);
        });
        macro.instances.forEach(inst => {
            if (inst.iVar == undefined && inst.nInst != undefined) {
                if (reportedVars.has(inst.nInst.name)) {
                    accept('error', `Macro instance defines non-unique name '${inst.nInst.name}'.`, {
                        node: inst.nInst,
                        property: 'name',
                        code: IssueCodes.MacroVariableNameNotUnique
                    })
                }
                reportedVars.add(inst.nInst.name);

                if (reportedInstNames.has(inst.nInst.name)) {
                    accept('error', `Macro instance has already been defined '${inst.nInst.name}'.`, {
                        node: inst.nInst,
                        property: 'name',
                        code: IssueCodes.MacroVariableNameNotUnique
                    })
                }
                reportedInstNames.add(inst.nInst.name);
            } else if (inst.iVar != undefined && inst.iVar.ref != undefined && inst.nInst == undefined) {
                if (reportedInstNames.has(inst.iVar.ref.name)) {
                    accept('error', `Macro instance has already been defined '${inst.iVar.ref.name}'.`, {
                        node: inst,
                        property: 'iVar',
                        code: IssueCodes.MacroVariableNameNotUnique
                    })
                }
                reportedInstNames.add(inst.iVar.ref.name);
            }
        })
    }

    checkUniqueFunctionNames(mdl: Model, accept: ValidationAcceptor) {
        const reportedFunctions = new Set();
        mdl.functions.forEach(fct => {
            if (reportedFunctions.has(fct.name)) {
                accept('error', `Function has non-unique name '${fct.name}'.`, {
                    node: fct,
                    property: 'name',
                    code: IssueCodes.FunctionNameNotUnique
                });
            }
            reportedFunctions.add(fct.name);
        });
    }

    checkUniqueFunctionVariableNames(fct: IFunction, accept: ValidationAcceptor): void {
        const reportedVars = new Set();
        fct.parameter.forEach(param => {
            if (reportedVars.has(param.name)) {
                accept('error', `Function parameter has non-unique name '${param.name}'.`, {
                    node: param,
                    property: 'name',
                    code: IssueCodes.FunctionVariableNameNotUnique
                })
            }
            reportedVars.add(param.name);
        });
        fct.statements.forEach(stmt => {
            if (isFunctionStatement(stmt)) {
                ModelModelingLanguageUtils.getFunctionStatementDeepVariableNames(stmt).forEach(stmtVar => {
                    if (reportedVars.has(stmtVar.name)) {
                        accept('error', `Iterator has non-unique name '${stmtVar.name}'.`, {
                            node: stmtVar,
                            property: 'name',
                            code: IssueCodes.FunctionVariableNameNotUnique
                        })
                    }
                    reportedVars.add(stmtVar.name);
                });
            }
        });
    }

    checkFunctionMacroCallArguments(fmc: FunctionMacroCall, accept: ValidationAcceptor) {
        if (fmc.macro.ref != undefined) {
            // macro is linked
            const calledMacro = fmc.macro.ref;
            if (fmc.args.length < calledMacro.parameter.length) {
                // too few arguments provided
                const missingArgs = calledMacro.parameter.slice(fmc.args.length, calledMacro.parameter.length).map(ma => ma.typing.dtype != undefined ? ma.typing.dtype : ma.typing.type != undefined && ma.typing.type.ref != undefined ? ModelModelingLanguageUtils.getQualifiedClassName(ma.typing.type.ref, ma.typing.type.ref.name) : "unknown parameter").join(', ');
                accept('error', `Missing arguments ${fmc.macro.ref.name}(${missingArgs})`, {
                    node: fmc,
                    code: IssueCodes.FunctionMacroCallArgumentLengthMismatch
                })
            } else if (fmc.args.length > calledMacro.parameter.length) {
                // too many arguments provided
                accept('error', `Expected ${calledMacro.parameter.length} arguments, found ${fmc.args.length}`, {
                    node: fmc,
                    code: IssueCodes.FunctionMacroCallArgumentLengthMismatch
                })
            } else {
                // correct number of arguments provided
                fmc.args.forEach((arg, idx) => {
                    // iterate over all provided arguments
                    const macroParamVarInst = calledMacro.parameter.at(idx);
                    if (macroParamVarInst == undefined) {
                        return;
                    }
                    const macroParamVarTyping = ModelModelingLanguageUtils.getVariableTyping(macroParamVarInst);
                    if ((arg.value != undefined && arg.ref == undefined) || (arg.ref != undefined && arg.ref.ref != undefined && ModelModelingLanguageUtils.getVariableTyping(arg.ref.ref) != undefined && ModelModelingLanguageUtils.getVariableTyping(arg.ref.ref).dtype != undefined && ModelModelingLanguageUtils.getVariableTyping(arg.ref.ref).type == undefined)) {
                        // provided value is constant primitive value or variable of primitive type
                        if (macroParamVarTyping.dtype != undefined && macroParamVarTyping.type == undefined) {
                            // requested parameter has primitive datatype
                            if (arg.value != undefined && arg.ref == undefined) {
                                // provided value has constant primitive datatype
                                if (!ModelModelingLanguageUtils.doesValueExpTypeMatch(macroParamVarTyping.dtype, arg.value)) {
                                    // primitive datatypes do not match
                                    accept('error', `Invalid argument type - Expected type "${macroParamVarTyping.dtype}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionMacroCallArgumentTypeMismatch
                                    })
                                }
                            } else if (arg.value == undefined && arg.ref != undefined && arg.ref.ref != undefined) {
                                // provided value is variable with primitive value
                                if (ModelModelingLanguageUtils.getVariableTyping(arg.ref.ref).dtype != macroParamVarTyping.dtype) {
                                    // primitive datatypes do not match
                                    accept('error', `Invalid argument type - Expected type "${macroParamVarTyping.dtype}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionMacroCallArgumentTypeMismatch
                                    })
                                }
                            }
                        } else if (macroParamVarTyping.dtype == undefined && macroParamVarTyping.type != undefined) {
                            // requested datatype has class type
                            if (arg.ref == undefined && arg.value != undefined && isEnum(macroParamVarTyping.type) && isEnumValueExpr(arg.value) && arg.value.val.ref != undefined) {
                                // requested and provided value has enum datatype
                                const enumEntry: EnumEntry = arg.value.val.ref;
                                if (enumEntry != undefined) {
                                    // enum is linked
                                    const enumContainer: Enum = enumEntry.$container;
                                    if (macroParamVarTyping.type != enumContainer) {
                                        // enum type does not match requested type
                                        accept('error', `Macro expects reference to enum of type "${ModelModelingLanguageUtils.getQualifiedClassName(macroParamVarTyping.type, macroParamVarTyping.type.name)}"`, {
                                            node: fmc,
                                            property: "args",
                                            index: idx,
                                            code: IssueCodes.FunctionMacroCallArgumentTypeMismatch
                                        });
                                    }
                                }
                            } else if (isFunctionVariableSelectorExpr(arg.value) && arg.value.val.ref != undefined) {
                                // provided value is variable selector
                                if (macroParamVarTyping.type != ModelModelingLanguageUtils.getVariableTyping(arg.value.val.ref).type) {
                                    // provided value does not match selector type
                                    accept('error', `Macro expects reference to ${macroParamVarTyping.type.$type.toLowerCase()} of type "${ModelModelingLanguageUtils.getQualifiedClassName(macroParamVarTyping.type, macroParamVarTyping.type.name)}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionCallArgumentTypeMismatch
                                    })
                                }
                            } else {
                                // constant value is requested but class type is provided
                                accept('error', `Macro expects reference to ${macroParamVarTyping.type.$type.toLowerCase()} of type "${ModelModelingLanguageUtils.getQualifiedClassName(macroParamVarTyping.type, macroParamVarTyping.type.name)}"`, {
                                    node: fmc,
                                    property: "args",
                                    index: idx,
                                    code: IssueCodes.FunctionMacroCallArgumentTypeMismatch
                                });
                            }
                        }

                    } else if (arg.value == undefined && arg.ref != undefined && arg.ref.ref != undefined) {
                        // provided value has class type
                        const argRefRefTyping = ModelModelingLanguageUtils.getVariableTyping(arg.ref.ref);
                        if (argRefRefTyping.dtype == undefined && argRefRefTyping.type != undefined) {
                            // referenced value is no primitive type
                            if (macroParamVarInst.typing.dtype != undefined && macroParamVarInst.typing.type == undefined) {
                                // requested primitive datatype but got class type
                                accept('error', `Incorrect type - macro expects parameters of type ${macroParamVarTyping.dtype}`, {
                                    node: fmc,
                                    property: "args",
                                    index: idx,
                                    code: IssueCodes.FunctionMacroCallArgumentTypeMismatch
                                })
                            } else if (macroParamVarTyping.dtype == undefined && macroParamVarTyping.type != undefined) {
                                // requested class type and got class type
                                const paramClass = macroParamVarTyping.type;
                                const argClass = argRefRefTyping.type;
                                if (paramClass != argClass) {
                                    // class types do not match
                                    accept('error', `Incorrect type - macro expects reference to class of type "${ModelModelingLanguageUtils.getQualifiedClassName(paramClass, paramClass.name)}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionMacroCallArgumentTypeMismatch
                                    })
                                }
                            }
                        }
                    }
                });
            }

        }
    }

    checkFunctionCallArguments(fmc: FunctionCall, accept: ValidationAcceptor) {
        if (fmc.func.ref != undefined) {
            // function is linked
            const calledFunc = fmc.func.ref;
            if (fmc.args.length < calledFunc.parameter.length) {
                // too few arguments provided
                const missingArgs = calledFunc.parameter.slice(fmc.args.length, calledFunc.parameter.length).map(ma => ma.typing.dtype != undefined ? ma.typing.dtype : ma.typing.type != undefined && ma.typing.type.ref != undefined ? ModelModelingLanguageUtils.getQualifiedClassName(ma.typing.type.ref, ma.typing.type.ref.name) : "unknown parameter").join(', ');
                accept('error', `Missing arguments ${fmc.func.ref.name}(${missingArgs})`, {
                    node: fmc,
                    code: IssueCodes.FunctionCallArgumentLengthMismatch
                })
            } else if (fmc.args.length > calledFunc.parameter.length) {
                // too many arguments provided
                accept('error', `Expected ${calledFunc.parameter.length} arguments, found ${fmc.args.length}`, {
                    node: fmc,
                    code: IssueCodes.FunctionCallArgumentLengthMismatch
                })
            } else {
                // correct number of arguments provided
                fmc.args.forEach((arg, idx) => {
                    // iterate over all provided arguments
                    const funcParamVarInst = calledFunc.parameter.at(idx);
                    if (funcParamVarInst == undefined) {
                        return;
                    }
                    const funcParamVarTyping = ModelModelingLanguageUtils.getVariableTyping(funcParamVarInst);
                    if ((arg.value != undefined && arg.ref == undefined) || (arg.ref != undefined && arg.ref.ref != undefined && ModelModelingLanguageUtils.getVariableTyping(arg.ref.ref) != undefined && ModelModelingLanguageUtils.getVariableTyping(arg.ref.ref).dtype != undefined && ModelModelingLanguageUtils.getVariableTyping(arg.ref.ref).type == undefined)) {
                        // provided value is constant primitive value or variable of primitive type
                        if (funcParamVarTyping.dtype != undefined && funcParamVarTyping.type == undefined) {
                            // requested parameter has primitive datatype
                            if (arg.value != undefined && arg.ref == undefined) {
                                // provided value has constant primitive datatype
                                if (!ModelModelingLanguageUtils.doesValueExpTypeMatch(funcParamVarTyping.dtype, arg.value)) {
                                    // primitive datatypes do not match
                                    accept('error', `Invalid argument type - Expected type "${funcParamVarTyping.dtype}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionCallArgumentTypeMismatch
                                    })
                                }
                            } else if (arg.value == undefined && arg.ref != undefined && arg.ref.ref != undefined) {
                                // provided value is variable with primitive value
                                if (ModelModelingLanguageUtils.getVariableTyping(arg.ref.ref).dtype != funcParamVarTyping.dtype) {
                                    // primitive datatypes do not match
                                    accept('error', `Invalid argument type - Expected type "${funcParamVarTyping.dtype}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionCallArgumentTypeMismatch
                                    })
                                }
                            }
                        } else if (funcParamVarTyping.dtype == undefined && funcParamVarTyping.type != undefined) {
                            // requested datatype has class type
                            if (isEnum(funcParamVarTyping.type)) {
                                // provided value has enum datatype
                                if (arg.value != undefined && arg.ref == undefined) {
                                    // provided value constant
                                    if (isEnumValueExpr(arg.value) && arg.value.val.ref != undefined) {
                                        // provided value is EnumValueExpr
                                        if (ModelModelingLanguageUtils.getEnumValueExprEnumName(arg.value) != ModelModelingLanguageUtils.getQualifiedClassName(funcParamVarTyping.type, funcParamVarTyping.type.name)) {
                                            // ...but type does not match
                                            accept('error', `Invalid argument type - Expected type "${ModelModelingLanguageUtils.getQualifiedClassName(funcParamVarTyping.type, funcParamVarTyping.type.name)}"`, {
                                                node: fmc,
                                                property: "args",
                                                index: idx,
                                                code: IssueCodes.FunctionCallArgumentTypeMismatch
                                            })
                                        }
                                    }
                                    if (!(isEnumValueExpr(arg.value) && arg.value.val.ref != undefined && arg.value.val.ref.$container == funcParamVarTyping.type)) {
                                        // provided type does not match enum
                                        accept('error', `Invalid argument type - Expected type "${ModelModelingLanguageUtils.getQualifiedClassName(funcParamVarTyping.type, funcParamVarTyping.type.name)}"`, {
                                            node: fmc,
                                            property: "args",
                                            index: idx,
                                            code: IssueCodes.FunctionCallArgumentTypeMismatch
                                        })
                                    }
                                } else if (arg.value == undefined && arg.ref != undefined && arg.ref.ref != undefined) {
                                    // provided value is variable
                                    if (ModelModelingLanguageUtils.getVariableTyping(arg.ref.ref).type != funcParamVarTyping.type) {
                                        // ...but type does not match
                                        accept('error', `Invalid argument type - Expected type "${funcParamVarTyping.type.$type.toLowerCase()}"`, {
                                            node: fmc,
                                            property: "args",
                                            index: idx,
                                            code: IssueCodes.FunctionCallArgumentTypeMismatch
                                        })
                                    }
                                }
                            } else if (isFunctionVariableSelectorExpr(arg.value) && arg.value.val.ref != undefined) {
                                // provided value is variable selector
                                if (funcParamVarTyping.type != ModelModelingLanguageUtils.getVariableTyping(arg.value.val.ref).type) {
                                    // provided value does not match selector type
                                    accept('error', `Function expects reference to ${funcParamVarTyping.type.$type.toLowerCase()} of type "${ModelModelingLanguageUtils.getQualifiedClassName(funcParamVarTyping.type, funcParamVarTyping.type.name)}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionCallArgumentTypeMismatch
                                    })
                                }
                            } else {
                                // constant value is requested but class type is provided
                                accept('error', `Function expects reference to ${funcParamVarTyping.type.$type.toLowerCase()} of type "${ModelModelingLanguageUtils.getQualifiedClassName(funcParamVarTyping.type, funcParamVarTyping.type.name)}"`, {
                                    node: fmc,
                                    property: "args",
                                    index: idx,
                                    code: IssueCodes.FunctionCallArgumentTypeMismatch
                                })
                            }
                        }
                    } else if (arg.value == undefined && arg.ref != undefined && arg.ref.ref != undefined) {
                        // provided value has class type
                        const argRefRefTyping = ModelModelingLanguageUtils.getVariableTyping(arg.ref.ref);
                        if (argRefRefTyping.dtype == undefined && argRefRefTyping.type != undefined) {
                            // referenced value is no primitive type
                            if (funcParamVarInst.typing.dtype != undefined && funcParamVarInst.typing.type == undefined) {
                                // requested primitive datatype but got class type
                                accept('error', `Incorrect type - function expects parameters of type ${funcParamVarTyping.dtype}`, {
                                    node: fmc,
                                    property: "args",
                                    index: idx,
                                    code: IssueCodes.FunctionCallArgumentTypeMismatch
                                })
                            } else if (funcParamVarTyping.dtype == undefined && funcParamVarTyping.type != undefined) {
                                // requested class type and got class type
                                const paramClass = funcParamVarTyping.type;
                                const argClass = argRefRefTyping.type;
                                if (paramClass != argClass) {
                                    // class types do not match
                                    accept('error', `Incorrect type - function expects reference to ${paramClass.$type.toLowerCase()} of type "${ModelModelingLanguageUtils.getQualifiedClassName(paramClass, paramClass.name)}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionCallArgumentTypeMismatch
                                    })
                                }
                            }
                        }
                    }
                });
            }

        }
    }

    checkFunctionReturnConfiguration(func: IFunction, accept: ValidationAcceptor) {
        if (func.returnsVar) {
            const lastElement = func.statements.at(-1);
            if (lastElement != undefined && isFunctionReturn(lastElement)) {
                const functionType = ModelModelingLanguageUtils.getFunctionReturnStatementType(lastElement);
                const functionSignatureType = ModelModelingLanguageUtils.getFunctionSignatureReturnType(func);
                if (functionType != functionSignatureType) {
                    accept('error', `Mismatching types - The function returns a value of type ${functionType}, but the signature declares the type as ${functionSignatureType}`, {
                        node: func,
                        property: "statements",
                        index: func.statements.length - 1,
                        code: IssueCodes.FunctionReturnSignatureTypeMismatch
                    })
                }
            } else if (lastElement == undefined || !isFunctionReturn(lastElement)) {
                accept('error', `The function does not contain a return statement`, {
                    node: func,
                    keyword: "returns",
                    code: IssueCodes.FunctionReturnStatementMissing
                })
            }
        } else {
            const lastElement = func.statements.at(-1);
            if (lastElement != undefined && isFunctionReturn(lastElement)) {
                accept('error', `No return type is defined in the function signature`, {
                    node: func,
                    property: "statements",
                    index: func.statements.length - 1,
                    code: IssueCodes.FunctionReturnTypeSignatureMissing
                })
            }
        }
    }

    checkFunctionAssignment(fa: FunctionAssignment, accept: ValidationAcceptor) {
        if (isFunctionMacroCall(fa.call)) {
            if (fa.select == undefined) {
                if (!isFunctionVariable(fa.var)) {
                    accept('error', `Macro calls return a tuple! Change the variable type to "tuple" or select an element.`, {
                        node: fa,
                        property: "var",
                        code: IssueCodes.FunctionAssignmentTupleHandlingMismatch
                    })
                }
            } else {
                if (isFunctionVariable(fa.var)) {
                    accept('error', `Tuple not applicable, selector is specified`, {
                        node: fa,
                        property: "var",
                        code: IssueCodes.FunctionAssignmentTupleHandlingMismatch
                    })
                } else if (fa.var.typing.dtype != undefined && fa.var.typing.type == undefined) {
                    accept('error', `Class type expected`, {
                        node: fa,
                        property: "var",
                        code: IssueCodes.FunctionAssignmentTypeMismatch
                    })
                } else if (fa.var.typing.dtype == undefined && fa.var.typing.type != undefined) {
                    if (fa.var.typing.type.ref != undefined && fa.select.ref != undefined && fa.select.ref.typing.type != undefined && fa.select.ref.typing.type.ref != undefined) {
                        const varRefClass = fa.var.typing.type.ref;
                        const selRefClass = fa.select.ref.typing.type.ref;
                        if (varRefClass != selRefClass) {
                            accept('error', `Incorrect variable type. Tuple variable ${fa.select.ref.name} has type "${ModelModelingLanguageUtils.getQualifiedClassName(selRefClass, selRefClass.name)}", not "${ModelModelingLanguageUtils.getQualifiedClassName(varRefClass, varRefClass.name)}"!`, {
                                node: fa,
                                property: "var",
                                code: IssueCodes.FunctionAssignmentTypeMismatch
                            })
                        }
                    }
                }
            }
        } else if (isFunctionCall(fa.call)) {
            if (fa.select != undefined) {
                accept('error', `Selectors are not allowed for function calls - functions return concrete values`, {
                    node: fa,
                    property: "select",
                    code: IssueCodes.FunctionAssignmentTupleHandlingMismatch
                })
            }
            if (isFunctionVariable(fa.var)) {
                accept('error', `Function cannot return tuple`, {
                    node: fa,
                    property: "var",
                    code: IssueCodes.FunctionAssignmentTupleHandlingMismatch
                })
            } else {
                if (fa.call.func.ref != undefined) {
                    if (!fa.call.func.ref.returnsVar) {
                        accept('error', `Function does not return anything`, {
                            node: fa,
                            property: "var",
                            code: IssueCodes.FunctionAssignmentWithVoidFunction
                        })
                    } else {
                        const varType = ModelModelingLanguageUtils.getInstanceVariableType(fa.var);
                        const functionReturnType = ModelModelingLanguageUtils.getFunctionSignatureReturnType(fa.call.func.ref);
                        if (varType != functionReturnType && fa.call.func.ref.typing != undefined) {
                            accept('error', `Type mismatch: Function returns value of type "${functionReturnType}"`, {
                                node: fa.var,
                                property: "typing",
                                code: IssueCodes.FunctionAssignmentTypeMismatch
                            })
                        }
                    }
                }
            }
        }
    }

    checkFunctionLoops(fl: FunctionLoop, accept: ValidationAcceptor) {
        if (fl.lower > fl.upper) {
            accept('error', `Start value can not be greater than the finish value`, {
                node: fl,
                code: IssueCodes.FunctionLoopBoundaryMismatch
            })
        }
    }

    checkUniqueInstanceNames(mdl: Model, accept: ValidationAcceptor) {
        const reportedInstances = new Set();
        mdl.instances.forEach(inst => {
            if (reportedInstances.has(inst.name)) {
                accept('error', `Instance has non-unique name '${inst.name}'.`, {
                    node: inst,
                    property: 'name',
                    code: IssueCodes.InstanceNameNotUnique
                });
            }
            reportedInstances.add(inst.name);
        });
    }

    checkInstanceLoops(instLoop: InstanceLoop, accept: ValidationAcceptor) {
        if (instLoop.var.ref != undefined && instLoop.var.ref.typing != undefined && instLoop.var.ref.typing.dtype != undefined && instLoop.var.ref.typing.type == undefined) {
            accept('error', `No class type - instance loops iterate over the elements of a reference of a class`, {
                node: instLoop,
                property: "var",
                code: IssueCodes.InstanceLoopTypeMismatch
            })
        }
    }

    checkArithExprOperations(expr: ArithExpr, accept: ValidationAcceptor) {
        if (isBinaryExpression(expr)) {
            if (!(ModelModelingLanguageUtils.isNumberArithExpr(expr.left) && ModelModelingLanguageUtils.isNumberArithExpr(expr.right))) {
                if ((ModelModelingLanguageUtils.isNumberArithExpr(expr.left) && ModelModelingLanguageUtils.isStringArithExpr(expr.right)) || (ModelModelingLanguageUtils.isStringArithExpr(expr.left) && ModelModelingLanguageUtils.isNumberArithExpr(expr.right))) {
                    if (!(expr.operator == "*" || expr.operator == "+")) {
                        accept('error', `Invalid arithmetic operation | Allowed operations for strings and numbers are: ["*", "+"]`, {
                            node: expr,
                            code: IssueCodes.ArithExpressionUnsupportedOperation
                        })
                    }
                } else if (ModelModelingLanguageUtils.isStringArithExpr(expr.left) && ModelModelingLanguageUtils.isStringArithExpr(expr.right)) {
                    if (expr.operator != "+") {
                        accept('error', `Invalid arithmetic operation | Only string concatenation with operator "+" allowed`, {
                            node: expr,
                            code: IssueCodes.ArithExpressionUnsupportedOperation
                        })
                    }
                } else {
                    accept('error', `Invalid arithmetic operation`, {
                        node: expr,
                        code: IssueCodes.ArithExpressionUnsupportedOperation
                    })
                }
            }
        }
    }

    checkFunctionArgumentSelector(fSelectorExpr: FunctionVariableSelectorExpr, accept: ValidationAcceptor) {
        console.log(`[FVARSELEXPRCHECK] ${fSelectorExpr.val.ref?.name} |${fSelectorExpr.$cstNode?.range.start.line}`)
        if (fSelectorExpr.val != undefined) {
            const matches = fSelectorExpr.val.$refText.match(/\./g);
            if (matches != null && matches.length != 1) {
                accept('error', `Invalid tuple selector`, {
                    node: fSelectorExpr,
                    code: IssueCodes.InvalidTupleSelectorInParameter
                })
            }
        }
    }

    checkMacroInstanceInstanciator(mInst: MacroInstance, accept: ValidationAcceptor) {
        let typing: VariableType | null = null;
        let varNode: AstNode | null = null;
        if (mInst.nInst != undefined && mInst.iVar == undefined) {
            typing = mInst.nInst.typing;
            varNode = mInst.nInst;
        } else if (mInst.nInst == undefined && mInst.iVar != undefined && mInst.iVar.ref != undefined) {
            typing = mInst.iVar.ref.typing;
            varNode = mInst.iVar.ref;
        }

        if (typing != null && varNode != null) {
            if (typing.type != undefined && typing.type.ref != undefined && typing.dtype == undefined) {
                const refType: AbstractElement = typing.type.ref
                if (isInterface(refType)) {
                    const intf: Interface = refType;
                    accept('error', `Cannot instantiate interface ${ModelModelingLanguageUtils.getQualifiedClassName(intf, intf.name)}`, {
                        node: varNode,
                        code: IssueCodes.InstantiationOfInterface
                    })
                } else if (isClass(refType)) {
                    const cls: Class = refType;
                    if (cls.abstract) {
                        accept('error', `Cannot instantiate abstract class ${ModelModelingLanguageUtils.getQualifiedClassName(cls, cls.name)}`, {
                            node: varNode,
                            code: IssueCodes.InstantiationOfAbstractClass
                        })
                    }
                } else if (isEnum(refType)) {
                    accept('error', `Cannot instantiate enum!`, {
                        node: varNode,
                        code: IssueCodes.InstantiationOfEnum
                    })
                }
            } else if (typing.type == undefined && typing.dtype != undefined) {
                accept('error', `Cannot instantiate with primitive type ${typing.dtype}`, {
                    node: varNode,
                    code: IssueCodes.InstantiationOfPrimitiveType
                })
            }
        }
    }
}
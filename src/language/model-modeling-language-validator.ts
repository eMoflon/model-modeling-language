import {AstNode, getDocument, LangiumDocument, URI, UriUtils, ValidationAcceptor, ValidationChecks} from 'langium';
import {
    AbstractElement,
    Attribute,
    AttributeModifiers,
    Class,
    CReference,
    Enum,
    EnumEntry,
    EnumValueExpr,
    Expression,
    FunctionAssignment,
    FunctionCall,
    FunctionLoop,
    FunctionMacroCall,
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
    isInterface,
    isModel,
    isNegatedExpression,
    isVariableValueExpr,
    MacroAssignStatement,
    MacroAttributeStatement,
    MacroInstance,
    Model,
    ModelModelingLanguageAstType,
    Multiplicity,
    Package,
    QualifiedValueExpr,
    ReferenceModifiers,
    TypedVariable,
    VariableType
} from './generated/ast.js';
import type {ModelModelingLanguageServices} from './model-modeling-language-module.js';
import {ModelModelingLanguageUtils} from "./model-modeling-language-utils.js";
import {ExprType, ExprUtils} from "./expr-utils.js";

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
        ReferenceModifiers: [
            validator.checkReferenceModifiersValidity,
            validator.checkReferenceModifiersNecessity
        ],
        Attribute: [
            validator.checkAttributeTypes
        ],
        AttributeModifiers: [
            validator.checkAttributeModifiersValidity,
            validator.checkAttributeModifiersNecessity
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
        Expression: [
            validator.checkExpressionOperations
        ],
        QualifiedValueExpr: [
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
    export const ExpressionUnsupportedOperation = "expression-unsupported-operation";
    export const InvalidTupleSelectorInParameter = "invalid-tuple-selector-in-parameter";
    export const InvalidUseOfAttributeInvocations = "invalid-use-of-attribute-invocations";
    export const InstantiationOfInterface = "instantiation-of-interface";
    export const InstantiationOfAbstractClass = "instantiation-of-abstract-class";
    export const InstantiationOfEnum = "instantiation-of-enum";
    export const InstantiationOfPrimitiveType = "instantiation-of-primitive-type";
    export const UnnecessaryAttributeModifier = "unnecessary-attribute-modifier";
    export const InvalidAttributeModifierCombination = "invalid-attribute-modifier-combination";
    export const UnnecessaryReferenceModifier = "unnecessary-reference-modifier";
    export const InvalidReferenceModifierCombination = "invalid-reference-modifier-combination";
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

        const documentURI = getDocument(cls).uri;

        let importedDocuments: Set<string> = new Set((ctnr as Model).imports.map(imprt => ModelModelingLanguageUtils.resolveRelativeModelImport(imprt.target, documentURI)).filter(x => x != undefined).map(x => x!.toString()));

        cls.extendedClasses.forEach(extCls => {
            if (extCls.ref == undefined) {
                const importableRelativePaths: string[] = this.services.references.ScopeProvider.getScopeFixingUris("Class", extCls.$refText, UriUtils.dirname(documentURI), new Set<string>(importedDocuments).add(documentURI.toString()));
                if (importableRelativePaths.length > 0) {
                    accept('error', `Create an import statement to include the referenced Definition!`, {
                        node: cls,
                        property: 'extendedClasses',
                        code: IssueCodes.ImportIsMissing,
                        data: importableRelativePaths
                    })
                }
            }
        })

        cls.implementedInterfaces.forEach(implIntrfc => {
            if (implIntrfc.ref == undefined) {
                const importableRelativePaths: string[] = this.services.references.ScopeProvider.getScopeFixingUris("Interface", implIntrfc.$refText, UriUtils.dirname(documentURI), new Set<string>(importedDocuments).add(documentURI.toString()));
                if (importableRelativePaths.length > 0) {
                    accept('error', `Create an import statement to include the referenced Definition!`, {
                        node: cls,
                        property: 'implementedInterfaces',
                        code: IssueCodes.ImportIsMissing,
                        data: importableRelativePaths
                    })
                }
            }
        })
    }

    checkInterfaceImports(intrfc: Interface, accept: ValidationAcceptor): void {
        let ctnr: Package | Model = intrfc.$container;
        while (!isModel(ctnr)) {
            ctnr = ctnr.$container;
        }

        const documentURI: URI = getDocument(intrfc).uri;

        let importedDocuments: Set<string> = new Set((ctnr as Model).imports.map(imprt => ModelModelingLanguageUtils.resolveRelativeModelImport(imprt.target, documentURI)).filter(x => x != undefined).map(x => x!.toString()));

        intrfc.extendedInterfaces.forEach(extIntrfc => {
            if (extIntrfc.ref == undefined) {
                const importableRelativePaths: string[] = this.services.references.ScopeProvider.getScopeFixingUris("Class", extIntrfc.$refText, UriUtils.dirname(documentURI), new Set<string>(importedDocuments).add(documentURI.toString()));
                if (importableRelativePaths.length > 0) {
                    accept('error', `Create an import statement to include the referenced Definition!`, {
                        node: intrfc,
                        property: 'extendedInterfaces',
                        code: IssueCodes.ImportIsMissing,
                        data: importableRelativePaths
                    })
                }
            }
        })
    }

    checkCReferenceImports(ref: CReference, accept: ValidationAcceptor): void {
        let ctnr: Class | Interface | Package | Model = ref.$container;
        while (!isModel(ctnr)) {
            ctnr = ctnr.$container;
        }

        const documentURI: URI = getDocument(ref).uri;

        let importedDocuments: Set<string> = new Set((ctnr as Model).imports.map(imprt => ModelModelingLanguageUtils.resolveRelativeModelImport(imprt.target, documentURI)).filter(x => x != undefined).map(x => x!.toString()));

        if (ref.type.ref == undefined) {
            const importableRelativePaths: string[] = this.services.references.ScopeProvider.getScopeFixingUris("Class", ref.type.$refText, UriUtils.dirname(documentURI), new Set<string>(importedDocuments).add(documentURI.toString()));
            if (importableRelativePaths.length > 0) {
                accept('error', `Create an import statement to include the referenced Definition!`, {
                    node: ref,
                    property: 'type',
                    code: IssueCodes.ImportIsMissing,
                    data: importableRelativePaths
                })
            }
        }

        if (ref.opposite != undefined) {
            if (ref.opposite.reference.ref == undefined) {
                const importableRelativePaths: string[] = this.services.references.ScopeProvider.getScopeFixingUris("CReference", ref.opposite.reference.$refText, UriUtils.dirname(documentURI), new Set<string>(importedDocuments).add(documentURI.toString()));
                if (importableRelativePaths.length > 0) {
                    accept('error', `Create an import statement to include the referenced Definition!`, {
                        node: ref.opposite,
                        property: 'reference',
                        code: IssueCodes.ImportIsMissing,
                        data: importableRelativePaths
                    })
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
                if (attr.type.ptype == "bool" && !ExprUtils.isBoolExpression(attr.defaultValue)) {
                    // bool type but default value is not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: attr,
                        property: 'type',
                        code: IssueCodes.AttributeTypeDoesNotMatch
                    })
                } else if (attr.type.ptype == "string" && !ExprUtils.isStringExpression(attr.defaultValue)) {
                    // string type but default value is not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: attr,
                        property: 'type',
                        code: IssueCodes.AttributeTypeDoesNotMatch
                    })
                } else if (attr.type.ptype == "int" && !ExprUtils.isIntExpression(attr.defaultValue)) {
                    // int type but default value is not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: attr,
                        property: 'type',
                        code: IssueCodes.AttributeTypeDoesNotMatch
                    })
                } else if ((attr.type.ptype == "double" || attr.type.ptype == "float") && !ExprUtils.isNumberExpressionType(ExprUtils.evaluateExpressionType(attr.defaultValue))) {
                    // number type but default value is not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: attr,
                        property: 'type',
                        code: IssueCodes.AttributeTypeDoesNotMatch
                    })
                }
            } else if (attr.type.ptype == undefined && attr.type.etype != undefined && attr.type.etype.ref != undefined && !ExprUtils.isEnumValueExpression(attr.defaultValue)) {
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
        const documentUri: URI = getDocument(modl).uri;
        modl.imports.forEach(ip => {
            const importedDocURI: URI | undefined = ModelModelingLanguageUtils.resolveRelativeModelImport(ip.target, documentUri);
            const docShadowedPackageNames: Set<string> = new Set();
            const unshadowedPackageNames: Set<string> = new Set();
            if (importedDocURI != undefined && this.services.shared.workspace.LangiumDocuments.hasDocument(importedDocURI)) {
                const importedDocument: LangiumDocument = this.services.shared.workspace.LangiumDocuments.getOrCreateDocument(importedDocURI);
                const importedRoot: Model = importedDocument.parseResult.value as Model;
                importedRoot.packages.forEach(pk => {
                    if (shadowedPackageNames.has(pk.name)) {
                        docShadowedPackageNames.add(pk.name);
                    }
                    unshadowedPackageNames.add(pk.name);
                });
                ip.aliases.forEach(alias => {
                    if (alias.ref.ref != undefined) {
                        docShadowedPackageNames.delete(alias.ref.ref.name);
                        unshadowedPackageNames.delete(alias.ref.ref.name);
                    }
                })
                unshadowedPackageNames.forEach(x => shadowedPackageNames.add(x));
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
        const documentUri: URI = getDocument(ip).uri;
        const importedDocURI: URI | undefined = ModelModelingLanguageUtils.resolveRelativeModelImport(ip.target, documentUri);
        if (UriUtils.equals(documentUri, importedDocURI)) {
            accept('error', `Document imports itself!`, {
                node: ip,
                property: 'target',
                code: IssueCodes.SelfImport
            })
        }
    }

    checkImportAliasRefsContained(ip: Import, accept: ValidationAcceptor) {
        const documentUri: URI = getDocument(ip).uri;
        const importedDocURI: URI | undefined = ModelModelingLanguageUtils.resolveRelativeModelImport(ip.target, documentUri);
        if (importedDocURI != undefined) {
            ip.aliases.forEach((ipa, idx) => {
                if (ipa.ref.ref == undefined || (!UriUtils.equals(getDocument(ipa.ref.ref).uri, importedDocURI))) {
                    accept('error', `Package ${ipa.ref.$refText} is not defined in this document!`, {
                        node: ip,
                        property: 'aliases',
                        index: idx,
                        code: IssueCodes.AliasReferencesUnknownPackage
                    })
                }
            });
        }
    }

    checkMacroAttributeStatementType(mas: MacroAttributeStatement, accept: ValidationAcceptor) {
        const attr = mas.attr.ref;
        if (attr != undefined && mas.value != undefined) {
            // both sides of statement are not undefined
            if (attr.type.ptype != undefined && attr.type.etype == undefined) {
                // attribute has primitive datatype, not enum type
                if (isVariableValueExpr(mas.value) && mas.value.val.ref != undefined) {
                    // value is known variable
                    if (!ExprType.equals(ExprType.fromMMLType(attr.type.ptype), ExprUtils.getVariableTyping(mas.value.val.ref).typeAsPrimitive)) {
                        // typing of variable does not match the defined attribute type
                        accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                            node: mas,
                            property: "value",
                            code: IssueCodes.MacroAttributeTypeDoesNotMatch
                        });
                    }
                } else if (attr.type.ptype == "bool" && !ExprUtils.isBoolExpression(mas.value)) {
                    // attribute has bool type but value has not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: mas,
                        property: "value",
                        code: IssueCodes.MacroAttributeTypeDoesNotMatch
                    });
                } else if (attr.type.ptype == "string" && !ExprUtils.isStringExpression(mas.value)) {
                    // attribute has string type but value has not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: mas,
                        property: "value",
                        code: IssueCodes.MacroAttributeTypeDoesNotMatch
                    });
                } else if (attr.type.ptype == "int" && !ExprUtils.isIntExpression(mas.value)) {
                    // attribute has int type but value has not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: mas,
                        property: "value",
                        code: IssueCodes.MacroAttributeTypeDoesNotMatch
                    });
                } else if ((attr.type.ptype == "double" || attr.type.ptype == "float") && !ExprUtils.isNumberExpression(mas.value)) {
                    // attribute has number type but value has not
                    accept('error', `Default value does not match specified attribute type (${attr.type.ptype})`, {
                        node: mas,
                        property: "value",
                        code: IssueCodes.MacroAttributeTypeDoesNotMatch
                    });
                }
            } else if (attr.type.ptype == undefined && attr.type.etype != undefined && attr.type.etype.ref != undefined) {
                // attribute has enum type, not primitive datatype
                if (ExprUtils.isEnumValueExpression(mas.value) && mas.value != undefined && (mas.value as EnumValueExpr).val.ref != undefined) {
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
                    const macroParamVarTyping = ExprUtils.getVariableTyping(macroParamVarInst);
                    if ((arg.value != undefined && arg.ref == undefined) || (arg.ref != undefined && arg.ref.ref != undefined && ExprUtils.getVariableTyping(arg.ref.ref) != undefined && ExprUtils.getVariableTyping(arg.ref.ref).isValidPrimitive && ExprUtils.getVariableTyping(arg.ref.ref).type == undefined)) {
                        // provided value is constant primitive value or variable of primitive type
                        if (macroParamVarTyping.isValidPrimitive) {
                            // requested parameter has primitive datatype
                            if (arg.value != undefined && arg.ref == undefined) {
                                // provided value has constant primitive datatype
                                if (!ExprType.equals(ExprUtils.evaluateExpressionType(arg.value), macroParamVarTyping.typeAsPrimitive)) {
                                    // primitive datatypes do not match
                                    accept('error', `Invalid argument type - Expected type "${ExprType.toMMLType(macroParamVarTyping.typeAsPrimitive)}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionMacroCallArgumentTypeMismatch
                                    })
                                }
                            } else if (arg.value == undefined && arg.ref != undefined && arg.ref.ref != undefined) {
                                // provided value is variable with primitive value
                                if (!ExprUtils.getVariableTyping(arg.ref.ref).equals(macroParamVarTyping)) {
                                    // primitive datatypes do not match
                                    accept('error', `Invalid argument type - Expected type "${ExprType.toMMLType(macroParamVarTyping.typeAsPrimitive)}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionMacroCallArgumentTypeMismatch
                                    })
                                }
                            }
                        } else if (macroParamVarTyping.isValidReference) {
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
                            } else if (arg.value != undefined && ExprUtils.isFunctionVariableInvocationExpr(arg.value)) {
                                // provided value is variable selector
                                if (macroParamVarTyping.type != ExprUtils.getVariableTyping(arg.value.val.ref as TypedVariable).type) {
                                    // provided value does not match selector type
                                    accept('error', `Macro expects reference to ${macroParamVarTyping.typeAsAbstractElement!.$type.toLowerCase()} of type "${ModelModelingLanguageUtils.getQualifiedClassName(macroParamVarTyping.typeAsAbstractElement!, macroParamVarTyping.typeAsAbstractElement!.name)}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionMacroCallArgumentTypeMismatch
                                    })
                                }
                            } else {
                                // constant value is requested but class type is provided
                                accept('error', `Macro expects reference to ${macroParamVarTyping.typeAsAbstractElement!.$type.toLowerCase()} of type "${ModelModelingLanguageUtils.getQualifiedClassName(macroParamVarTyping.typeAsAbstractElement!, macroParamVarTyping.typeAsAbstractElement!.name)}"`, {
                                    node: fmc,
                                    property: "args",
                                    index: idx,
                                    code: IssueCodes.FunctionMacroCallArgumentTypeMismatch
                                });
                            }
                        }

                    } else if (arg.value == undefined && arg.ref != undefined && arg.ref.ref != undefined) {
                        // provided value has class type
                        const argRefRefTyping = ExprUtils.getVariableTyping(arg.ref.ref);
                        if (argRefRefTyping.isValidReference) {
                            // referenced value is no primitive type
                            if (macroParamVarInst.typing.dtype != undefined && macroParamVarInst.typing.type == undefined) {
                                // requested primitive datatype but got class type
                                accept('error', `Incorrect type - macro expects parameters of type ${ExprType.toMMLType(macroParamVarTyping.typeAsPrimitive)}`, {
                                    node: fmc,
                                    property: "args",
                                    index: idx,
                                    code: IssueCodes.FunctionMacroCallArgumentTypeMismatch
                                })
                            } else if (macroParamVarTyping.isValidReference) {
                                // requested class type and got class type
                                const paramClass = macroParamVarTyping.typeAsAbstractElement;
                                const argClass = argRefRefTyping.typeAsAbstractElement;
                                if (paramClass != argClass) {
                                    // class types do not match
                                    accept('error', `Incorrect type - macro expects reference to class of type "${ModelModelingLanguageUtils.getQualifiedClassName(paramClass!, paramClass!.name)}"`, {
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
                    const funcParamVarTyping = ExprUtils.getVariableTyping(funcParamVarInst);
                    if ((arg.value != undefined && arg.ref == undefined) || (arg.ref != undefined && arg.ref.ref != undefined && !ExprUtils.getVariableTyping(arg.ref.ref).isInvalid && ExprUtils.getVariableTyping(arg.ref.ref).isValidPrimitive)) {
                        // provided value is constant primitive value or variable of primitive type
                        if (funcParamVarTyping.isValidPrimitive) {
                            // requested parameter has primitive datatype
                            if (arg.value != undefined && arg.ref == undefined) {
                                // provided value has constant primitive datatype
                                if (!ExprType.equals(ExprUtils.evaluateExpressionType(arg.value), funcParamVarTyping.typeAsPrimitive)) {
                                    // primitive datatypes do not match
                                    accept('error', `Invalid argument type - Expected type "${ExprType.toMMLType(funcParamVarTyping.typeAsPrimitive)}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionCallArgumentTypeMismatch
                                    })
                                }
                            } else if (arg.value == undefined && arg.ref != undefined && arg.ref.ref != undefined) {
                                // provided value is variable with primitive value
                                if (!funcParamVarTyping.equals(ExprUtils.getVariableTyping(arg.ref.ref))) {
                                    // primitive datatypes do not match
                                    accept('error', `Invalid argument type - Expected type "${ExprType.toMMLType(funcParamVarTyping.typeAsPrimitive)}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionCallArgumentTypeMismatch
                                    })
                                }
                            }
                        } else if (funcParamVarTyping.isValidReference) {
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
                                    if (!funcParamVarTyping.equals(ExprUtils.getVariableTyping(arg.ref.ref))) {
                                        // ...but type does not match
                                        accept('error', `Invalid argument type - Expected type "${funcParamVarTyping.type.$type.toLowerCase()}"`, {
                                            node: fmc,
                                            property: "args",
                                            index: idx,
                                            code: IssueCodes.FunctionCallArgumentTypeMismatch
                                        })
                                    }
                                }
                            } else if (arg.value != undefined && ExprUtils.isFunctionVariableInvocationExpr(arg.value)) {
                                // provided value is variable selector
                                if (!funcParamVarTyping.equals(ExprUtils.getVariableTyping(arg.value.val.ref as TypedVariable))) {
                                    // provided value does not match selector type
                                    accept('error', `Function expects reference to ${funcParamVarTyping.typeAsAbstractElement!.$type.toLowerCase()} of type "${ModelModelingLanguageUtils.getQualifiedClassName(funcParamVarTyping.typeAsAbstractElement!, funcParamVarTyping.typeAsAbstractElement!.name)}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx,
                                        code: IssueCodes.FunctionCallArgumentTypeMismatch
                                    })
                                }
                            } else {
                                // constant value is requested but class type is provided
                                accept('error', `Function expects reference to ${funcParamVarTyping.typeAsAbstractElement!.$type.toLowerCase()} of type "${ModelModelingLanguageUtils.getQualifiedClassName(funcParamVarTyping.typeAsAbstractElement!, funcParamVarTyping.typeAsAbstractElement!.name)}"`, {
                                    node: fmc,
                                    property: "args",
                                    index: idx,
                                    code: IssueCodes.FunctionCallArgumentTypeMismatch
                                })
                            }
                        }
                    } else if (arg.value == undefined && arg.ref != undefined && arg.ref.ref != undefined) {
                        // provided value has class type
                        const argRefRefTyping = ExprUtils.getVariableTyping(arg.ref.ref);
                        if (argRefRefTyping.isValidReference) {
                            // referenced value is no primitive type
                            if (funcParamVarInst.typing.dtype != undefined && funcParamVarInst.typing.type == undefined) {
                                // requested primitive datatype but got class type
                                accept('error', `Incorrect type - function expects parameters of type ${ExprType.toMMLType(funcParamVarTyping.typeAsPrimitive)}`, {
                                    node: fmc,
                                    property: "args",
                                    index: idx,
                                    code: IssueCodes.FunctionCallArgumentTypeMismatch
                                })
                            } else if (funcParamVarTyping.isValidReference) {
                                // requested class type and got class type
                                const paramClass = funcParamVarTyping.typeAsAbstractElement;
                                const argClass = argRefRefTyping.typeAsAbstractElement;
                                if (paramClass != argClass) {
                                    // class types do not match
                                    accept('error', `Incorrect type - function expects reference to ${paramClass!.$type.toLowerCase()} of type "${ModelModelingLanguageUtils.getQualifiedClassName(paramClass!, paramClass!.name)}"`, {
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

    checkExpressionOperations(expr: Expression, accept: ValidationAcceptor) {
        if (isNegatedExpression(expr)) {
            accept('error', `Invalid operation | MML does not support negated expressions`, {
                node: expr,
                code: IssueCodes.ExpressionUnsupportedOperation
            })
            return;
        }
        if (isBinaryExpression(expr)) {
            if (expr.operator == "&&" || expr.operator == "||") {
                accept('error', `Invalid operation | MML does not support logical expressions`, {
                    node: expr,
                    code: IssueCodes.ExpressionUnsupportedOperation
                })
                return;
            }
            if (expr.operator == "==" || expr.operator == "!=") {
                accept('error', `Invalid operation | MML does not support compare expressions`, {
                    node: expr,
                    code: IssueCodes.ExpressionUnsupportedOperation
                })
                return;
            }

            if (expr.operator == "<" || expr.operator == "<=" || expr.operator == ">" || expr.operator == ">=") {
                accept('error', `Invalid operation | MML does not support compare expressions`, {
                    node: expr,
                    code: IssueCodes.ExpressionUnsupportedOperation
                })
                return;
            }

            if (!(ExprUtils.isNumberExpression(expr.left) && ExprUtils.isNumberExpression(expr.right))) {
                if ((ExprUtils.isNumberExpression(expr.left) && ExprUtils.isStringExpression(expr.right)) || (ExprUtils.isStringExpression(expr.left) && ExprUtils.isNumberExpression(expr.right))) {
                    if (!(expr.operator == "*" || expr.operator == "+")) {
                        accept('error', `Invalid arithmetic operation | Allowed operations for strings and numbers are: ["*", "+"]`, {
                            node: expr,
                            code: IssueCodes.ExpressionUnsupportedOperation
                        })
                    }
                } else if (ExprUtils.isStringExpression(expr.left) && ExprUtils.isStringExpression(expr.right)) {
                    if (expr.operator != "+") {
                        accept('error', `Invalid arithmetic operation | Only string concatenation with operator "+" allowed`, {
                            node: expr,
                            code: IssueCodes.ExpressionUnsupportedOperation
                        })
                    }
                } else {
                    accept('error', `Invalid arithmetic operation`, {
                        node: expr,
                        code: IssueCodes.ExpressionUnsupportedOperation
                    })
                }
            }
        }
    }

    checkFunctionArgumentSelector(fSelectorExpr: QualifiedValueExpr, accept: ValidationAcceptor) {
        console.log(`[QVALUEEXPR] ${fSelectorExpr.val.ref?.name} |${fSelectorExpr.$cstNode?.range.start.line}`)
        if (ExprUtils.isFunctionVariableInvocationExpr(fSelectorExpr)) {
            if (fSelectorExpr.val != undefined) {
                const matches = fSelectorExpr.val.$refText.match(/\./g);
                if (matches != null && matches.length != 1) {
                    accept('error', `Invalid tuple selector`, {
                        node: fSelectorExpr,
                        code: IssueCodes.InvalidTupleSelectorInParameter
                    })
                }
            }
        } else if (ExprUtils.isAttributeInvocationVariableExpr(fSelectorExpr)) {
            accept('error', `You cannot use attribute invocations here!`, {
                node: fSelectorExpr,
                code: IssueCodes.InvalidUseOfAttributeInvocations
            })
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

    checkAttributeModifiersValidity(aMod: AttributeModifiers, accept: ValidationAcceptor) {
        if (aMod.readonly && aMod.not_readonly) {
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'readonly',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'not_readonly',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
        }
        if (aMod.volatile && aMod.not_volatile) {
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'volatile',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'not_volatile',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
        }
        if (aMod.transient && aMod.not_transient) {
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'transient',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'not_transient',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
        }
        if (aMod.unsettable && aMod.not_unsettable) {
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'unsettable',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'not_unsettable',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
        }
        if (aMod.derived && aMod.not_derived) {
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'derived',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'not_derived',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
        }
        if (aMod.unique && aMod.not_unique) {
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'unique',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'not_unique',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
        }
        if (aMod.ordered && aMod.not_ordered) {
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'ordered',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'not_ordered',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
        }
        if (aMod.id && aMod.not_id) {
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'id',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: aMod,
                property: 'not_id',
                code: IssueCodes.InvalidAttributeModifierCombination
            })
        }
    }

    checkAttributeModifiersNecessity(aMod: AttributeModifiers, accept: ValidationAcceptor) {
        if (aMod.not_readonly) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: aMod,
                property: 'not_readonly',
                code: IssueCodes.UnnecessaryAttributeModifier
            })
        }
        if (aMod.not_volatile) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: aMod,
                property: 'not_volatile',
                code: IssueCodes.UnnecessaryAttributeModifier
            })
        }
        if (aMod.not_transient) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: aMod,
                property: 'not_transient',
                code: IssueCodes.UnnecessaryAttributeModifier
            })
        }
        if (aMod.not_unsettable) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: aMod,
                property: 'unsettable',
                code: IssueCodes.UnnecessaryAttributeModifier
            })
        }
        if (aMod.not_derived) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: aMod,
                property: 'derived',
                code: IssueCodes.UnnecessaryAttributeModifier
            })
        }
        if (aMod.unique) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: aMod,
                property: 'unique',
                code: IssueCodes.UnnecessaryAttributeModifier
            })
        }
        if (aMod.ordered) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: aMod,
                property: 'ordered',
                code: IssueCodes.UnnecessaryAttributeModifier
            })
        }
        if (aMod.not_id) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: aMod,
                property: 'not_id',
                code: IssueCodes.UnnecessaryAttributeModifier
            })
        }
    }

    checkReferenceModifiersValidity(rMod: ReferenceModifiers, accept: ValidationAcceptor) {
        if (rMod.readonly && rMod.not_readonly) {
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'readonly',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'not_readonly',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
        }
        if (rMod.volatile && rMod.not_volatile) {
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'volatile',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'not_volatile',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
        }
        if (rMod.transient && rMod.not_transient) {
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'transient',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'not_transient',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
        }
        if (rMod.unsettable && rMod.not_unsettable) {
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'unsettable',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'not_unsettable',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
        }
        if (rMod.derived && rMod.not_derived) {
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'derived',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'not_derived',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
        }
        if (rMod.unique && rMod.not_unique) {
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'unique',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'not_unique',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
        }
        if (rMod.ordered && rMod.not_ordered) {
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'ordered',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'not_ordered',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
        }
        if (rMod.resolve && rMod.not_resolve) {
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'resolve',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
            accept('error', `You have set contradictory modifiers!`, {
                node: rMod,
                property: 'not_resolve',
                code: IssueCodes.InvalidReferenceModifierCombination
            })
        }
    }

    checkReferenceModifiersNecessity(rMod: ReferenceModifiers, accept: ValidationAcceptor) {
        if (rMod.not_readonly) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: rMod,
                property: 'not_readonly',
                code: IssueCodes.UnnecessaryReferenceModifier
            })
        }
        if (rMod.not_volatile) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: rMod,
                property: 'not_volatile',
                code: IssueCodes.UnnecessaryReferenceModifier
            })
        }
        if (rMod.not_transient) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: rMod,
                property: 'not_transient',
                code: IssueCodes.UnnecessaryReferenceModifier
            })
        }
        if (rMod.not_unsettable) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: rMod,
                property: 'unsettable',
                code: IssueCodes.UnnecessaryReferenceModifier
            })
        }
        if (rMod.not_derived) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: rMod,
                property: 'derived',
                code: IssueCodes.UnnecessaryReferenceModifier
            })
        }
        if (rMod.unique) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: rMod,
                property: 'unique',
                code: IssueCodes.UnnecessaryReferenceModifier
            })
        }
        if (rMod.ordered) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: rMod,
                property: 'ordered',
                code: IssueCodes.UnnecessaryReferenceModifier
            })
        }
        if (rMod.resolve) {
            accept('info', `This is the default and does not have to be specifically defined!`, {
                node: rMod,
                property: 'resolve',
                code: IssueCodes.UnnecessaryReferenceModifier
            })
        }
    }
}

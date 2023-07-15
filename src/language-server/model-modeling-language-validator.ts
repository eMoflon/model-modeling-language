import {getDocument, LangiumDocument, ValidationAcceptor, ValidationChecks} from 'langium';
import {
    ArithExpr,
    Attribute,
    Class,
    CReference,
    Enum,
    FunctionAssignment,
    FunctionLoop,
    FunctionMacroCall,
    IFunction,
    IMacro,
    Import,
    InstanceLoop,
    InstanceVariable,
    Interface,
    isBinaryExpression,
    isBoolExpr,
    isFunctionAssignment,
    isFunctionCall,
    isFunctionLoop,
    isFunctionMacroCall,
    isFunctionReturn,
    isModel,
    isNumberExpr,
    isStringExpr,
    MacroAssignStatement,
    MacroAttributeStatement,
    Model,
    ModelModelingLanguageAstType,
    Multiplicity,
    Package
} from './generated/ast';
import type {ModelModelingLanguageServices} from './model-modeling-language-module';
import {URI} from "vscode-uri";
import {ModelModelingLanguageUtils} from "./model-modeling-language-utils";

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
    services: ModelModelingLanguageServices;

    constructor(services: ModelModelingLanguageServices) {
        this.services = services;
    }

    checkUniquePackageNames(modl: Model, accept: ValidationAcceptor): void {
        const reportedElements = new Set();
        modl.packages.forEach(pckg => {
            if (reportedElements.has(pckg.name)) {
                accept('error', `${pckg.$type} has non-unique name '${pckg.name}'.`, {node: pckg, property: 'name'})
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
                    property: 'name'
                })
            }
            reportedElements.add(subPckg.name);
        });
    }

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
                accept('error', `${stmt.$type} has non-unique name '${stmt.name}'.`, {node: stmt, property: 'name'})
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

    checkMultiplicities(mult: Multiplicity, accept: ValidationAcceptor) {
        if (mult != undefined) {
            const lowerSpec = mult.mult;
            if (mult.upperMult != undefined) {
                const upperSpec = mult.upperMult;
                if (lowerSpec.n_0 || lowerSpec.n) {
                    accept('error', `Lower bound cannot be unspecified when upper bound given`, {
                        node: mult.mult
                    })
                }
                if (!lowerSpec.n_0 && !lowerSpec.n && !upperSpec.n_0 && !upperSpec.n && lowerSpec.num != undefined && upperSpec.num && lowerSpec.num > upperSpec.num) {
                    accept('error', `Lower bound cannot be greater then upper bound (${lowerSpec.num} > ${upperSpec.num})`, {
                        node: mult.mult
                    })
                }
            }
        }

    }

    checkAttributeTypes(attr: Attribute, accept: ValidationAcceptor) {
        if (attr.defaultValue != undefined) {
            if (attr.type == "bool" && !ModelModelingLanguageUtils.isBoolArithExpr(attr.defaultValue)) {
                accept('error', `Default value does not match specified attribute type (${attr.type})`, {
                    node: attr,
                    property: 'type',
                    code: IssueCodes.AttributeTypeDoesNotMatch
                })
            } else if (attr.type == "string" && !ModelModelingLanguageUtils.isStringArithExpr(attr.defaultValue)) {
                accept('error', `Default value does not match specified attribute type (${attr.type})`, {
                    node: attr,
                    property: 'type',
                    code: IssueCodes.AttributeTypeDoesNotMatch
                })
            } else if (attr.type == "int" && !ModelModelingLanguageUtils.isIntArithExpr(attr.defaultValue)) {
                accept('error', `Default value does not match specified attribute type (${attr.type})`, {
                    node: attr,
                    property: 'type',
                    code: IssueCodes.AttributeTypeDoesNotMatch
                })
            } else if ((attr.type == "double" || attr.type == "float") && !ModelModelingLanguageUtils.isNumberArithExpr(attr.defaultValue)) {
                accept('error', `Default value does not match specified attribute type (${attr.type})`, {
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

    checkUniqueAliases(modl: Model, accept: ValidationAcceptor) {
        const knownAliases = new Set();
        const knownSuperPackages = new Set(modl.packages.map(p => p.name));
        modl.imports.forEach(ip => {
            ip.aliases.forEach((ipas, idx) => {
                if (knownAliases.has(ipas.alias)) {
                    accept('error', `This alias is already in use!`, {
                        node: ipas,
                        index: idx,
                        property: 'alias'
                    })
                } else if (knownSuperPackages.has(ipas.alias)) {
                    accept('error', `This alias shadows a package name in this file!`, {
                        node: ipas,
                        index: idx,
                        property: 'alias'
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
                        property: 'target'
                    })
                }
            } else {
                accept('error', `Document currently not managed by langium services`, {
                    node: ip,
                    property: 'target'
                })
            }
        })
    }

    checkSelfImport(ip: Import, accept: ValidationAcceptor) {
        const targetPath = ip.target;
        if (targetPath == getDocument(ip).uri.path) {
            accept('error', `Document imports itself!`, {
                node: ip,
                property: 'target'
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
                            index: idx
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
        if (attr != undefined) {
            if (attr.type == "bool" && !isBoolExpr(mas.value)) {
                accept('error', `Default value does not match specified attribute type (${attr.type})`, {
                    node: mas,
                    property: "value"
                });
            } else if (attr.type == "string" && !isStringExpr(mas.value)) {
                accept('error', `Default value does not match specified attribute type (${attr.type})`, {
                    node: mas,
                    property: "value"
                });
            } else if (attr.type == "int" && (!isNumberExpr(mas.value) || (isNumberExpr(mas.value) && mas.value.value % 1 !== 0))) {
                accept('error', `Default value does not match specified attribute type (${attr.type})`, {
                    node: mas,
                    property: "value"
                });
            } else if ((attr.type == "double" || attr.type == "float") && !isNumberExpr(mas.value)) {
                accept('error', `Default value does not match specified attribute type (${attr.type})`, {
                    node: mas,
                    property: "value"
                });
            }
        }
    }

    checkMacroAssignStatementType(mas: MacroAssignStatement, accept: ValidationAcceptor) {
        const targetReference: CReference | undefined = mas.cref.ref;
        const instVar: InstanceVariable | undefined = mas.instance.ref;
        if (targetReference != undefined && instVar != undefined) {
            if (instVar.dtype != undefined && instVar.type == undefined) {
                accept('error', `A reference cannot point to a variable of type "${instVar.dtype}"!`, {
                    node: mas,
                    property: "instance"
                });
            } else if (instVar.type != undefined) {
                const instVarClss = instVar.type.ref;
                const targetRefTypeClss = targetReference.type.ref;
                if (instVarClss != undefined && targetRefTypeClss != undefined) {
                    if (targetRefTypeClss != instVarClss) {
                        const qcn1 = ModelModelingLanguageUtils.getQualifiedClassName(targetRefTypeClss, targetRefTypeClss.name);
                        const qcn2 = ModelModelingLanguageUtils.getQualifiedClassName(instVarClss, instVarClss.name);
                        accept('error', `Non-matching types, a reference of type "${qcn1}" cannot have a class of type "${qcn2}"!`, {
                            node: mas,
                            property: "instance"
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
                accept('error', `Macro has non-unique name '${mcr.name}'.`, {node: mcr, property: 'name'});
            }
            reportedMacros.add(mcr.name);
        });
    }

    checkUniqueMacroVariableNames(macro: IMacro, accept: ValidationAcceptor): void {
        const reportedVars = new Set();
        const reportedInstNames = new Set();
        macro.parameter.forEach(param => {
            if (reportedVars.has(param.name)) {
                accept('error', `Macro parameter has non-unique name '${param.name}'.`, {node: param, property: 'name'})
            }
            reportedVars.add(param.name);
        });
        macro.instances.forEach(inst => {
            if (inst.iVar == undefined && inst.nInst != undefined) {
                if (reportedVars.has(inst.nInst.name)) {
                    accept('error', `Macro instance defines non-unique name '${inst.nInst.name}'.`, {
                        node: inst.nInst,
                        property: 'name'
                    })
                }
                reportedVars.add(inst.nInst.name);

                if (reportedInstNames.has(inst.nInst.name)) {
                    accept('error', `Macro instance has already been defined '${inst.nInst.name}'.`, {
                        node: inst.nInst,
                        property: 'name'
                    })
                }
                reportedInstNames.add(inst.nInst.name);
            } else if (inst.iVar != undefined && inst.iVar.ref != undefined && inst.nInst == undefined) {
                if (reportedInstNames.has(inst.iVar.ref.name)) {
                    accept('error', `Macro instance has already been defined '${inst.iVar.ref.name}'.`, {
                        node: inst,
                        property: 'iVar'
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
                accept('error', `Function has non-unique name '${fct.name}'.`, {node: fct, property: 'name'});
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
                    property: 'name'
                })
            }
            reportedVars.add(param.name);
        });
        fct.statements.forEach(stmt => {
            if (isFunctionAssignment(stmt) || isFunctionLoop(stmt)) {
                if (reportedVars.has(stmt.var.name)) {
                    accept('error', `Iterator has non-unique name '${stmt.var.name}'.`, {
                        node: stmt.var,
                        property: 'name'
                    })
                }
                reportedVars.add(stmt.var.name);
            }
        });
    }

    checkFunctionMacroCallArguments(fmc: FunctionMacroCall, accept: ValidationAcceptor) {
        if (fmc.macro.ref != undefined) {
            const calledMacro = fmc.macro.ref;
            if (fmc.args.length < calledMacro.parameter.length) {
                const missingArgs = calledMacro.parameter.slice(fmc.args.length, calledMacro.parameter.length).map(ma => ma.dtype != undefined ? ma.dtype : ma.type != undefined && ma.type.ref != undefined ? ModelModelingLanguageUtils.getQualifiedClassName(ma.type.ref, ma.type.ref.name) : "unknown parameter").join(', ');
                accept('error', `Missing arguments ${fmc.macro.ref.name}(${missingArgs})`, {
                    node: fmc
                })
            } else if (fmc.args.length > calledMacro.parameter.length) {
                accept('error', `Expected ${calledMacro.parameter.length} arguments, found ${fmc.args.length}`, {
                    node: fmc
                })
            } else {
                fmc.args.forEach((arg, idx) => {
                    const macroParamVarInst = calledMacro.parameter.at(idx);
                    if (macroParamVarInst == undefined) {
                        return;
                    }
                    if ((arg.value != undefined && arg.ref == undefined) || (arg.ref != undefined && arg.ref.ref != undefined && arg.ref.ref.dtype != undefined && arg.ref.ref.type == undefined)) {
                        if (macroParamVarInst.dtype != undefined && macroParamVarInst.type == undefined) {
                            if (arg.value != undefined && arg.ref == undefined) {
                                if (!ModelModelingLanguageUtils.doesValueExpTypeMatch(macroParamVarInst.dtype, arg.value)) {
                                    accept('error', `Invalid argument type - Expected type "${macroParamVarInst.dtype}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx
                                    })
                                }
                            } else if (arg.value == undefined && arg.ref != undefined && arg.ref.ref != undefined) {
                                if (arg.ref.ref.dtype != macroParamVarInst.dtype) {
                                    accept('error', `Invalid argument type - Expected type "${macroParamVarInst.dtype}"`, {
                                        node: fmc,
                                        property: "args",
                                        index: idx
                                    })
                                }
                            }
                        } else if (macroParamVarInst.dtype == undefined && macroParamVarInst.type != undefined) {
                            if (macroParamVarInst.type.ref != undefined) {
                                accept('error', `Macro expects reference to class of type "${ModelModelingLanguageUtils.getQualifiedClassName(macroParamVarInst.type.ref, macroParamVarInst.type.ref.name)}"`, {
                                    node: fmc,
                                    property: "args",
                                    index: idx
                                })
                            }
                        }

                    } else if ((arg.value == undefined && arg.ref != undefined) && (arg.ref.ref != undefined && arg.ref.ref.dtype == undefined && arg.ref.ref.type != undefined && arg.ref.ref.type.ref != undefined)) {
                        if (macroParamVarInst.dtype != undefined && macroParamVarInst.type == undefined) {
                            accept('error', `Incorrect type - macro expects parameters of type ${macroParamVarInst.dtype}`, {
                                node: fmc,
                                property: "args",
                                index: idx
                            })
                        } else if (macroParamVarInst.dtype == undefined && macroParamVarInst.type != undefined && macroParamVarInst.type.ref != undefined) {
                            const paramClass = macroParamVarInst.type.ref;
                            const argClass = arg.ref.ref.type.ref;
                            if (paramClass != argClass) {
                                accept('error', `Incorrect type - macro expects reference to class of type "${paramClass.name}"`, {
                                    node: fmc,
                                    property: "args",
                                    index: idx
                                })
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
                        index: func.statements.length - 1
                    })
                }
            } else if (lastElement != undefined && !isFunctionReturn(lastElement)) {
                accept('error', `The function does not contain a return statement`, {
                    node: func,
                    keyword: "returns"
                })
            }
        } else {
            const lastElement = func.statements.at(-1);
            if (lastElement != undefined && isFunctionReturn(lastElement)) {
                accept('error', `No return type is defined in the function signature`, {
                    node: func,
                    property: "statements",
                    index: func.statements.length - 1
                })
            }
        }
    }

    checkFunctionAssignment(fa: FunctionAssignment, accept: ValidationAcceptor) {
        if (isFunctionMacroCall(fa.call)) {
            if (fa.select == undefined) {
                if (fa.var.dtype != "tuple") {
                    accept('error', `Macro calls return a tuple! Change the variable type to "tuple" or select an element.`, {
                        node: fa,
                        property: "var"
                    })
                }
            } else {
                if (fa.var.dtype != undefined && fa.var.type == undefined) {
                    accept('error', `Class type expected`, {
                        node: fa,
                        property: "var"
                    })
                } else if (fa.var.dtype == undefined && fa.var.type != undefined) {
                    if (fa.var.type.ref != undefined && fa.select.ref != undefined && fa.select.ref.type != undefined && fa.select.ref.type.ref != undefined) {
                        const varRefClass = fa.var.type.ref;
                        const selRefClass = fa.select.ref.type.ref;
                        if (varRefClass != selRefClass) {
                            accept('error', `Incorrect variable type. Tuple variable ${fa.select.ref.name} has type "${selRefClass.name}", not "${varRefClass.name}"!`, {
                                node: fa,
                                property: "var"
                            })
                        }
                    }
                }
            }
        } else if (isFunctionCall(fa.call)) {
            if (fa.select != undefined) {
                accept('error', `Selectors are not allowed for function calls - functions return concrete values`, {
                    node: fa,
                    property: "select"
                })
            }
            if (fa.call.func.ref != undefined) {
                if (!fa.call.func.ref.returnsVar) {
                    accept('error', `Function does not return anything`, {
                        node: fa,
                        property: "var"
                    })
                } else {
                    const varType = ModelModelingLanguageUtils.getInstanceVariableType(fa.var);
                    const functionReturnType = ModelModelingLanguageUtils.getFunctionSignatureReturnType(fa.call.func.ref);
                    if (varType != functionReturnType) {
                        if (fa.call.func.ref.dtype != undefined && fa.call.func.ref.type == undefined) {
                            accept('error', `Type mismatch: Function returns value of type "${functionReturnType}"`, {
                                node: fa.var,
                                property: "dtype"
                            })
                        } else if (fa.call.func.ref.dtype == undefined && fa.call.func.ref.type != undefined && fa.call.func.ref.type.ref != undefined) {
                            accept('error', `Type mismatch: Function returns value of type "${functionReturnType}"`, {
                                node: fa.var,
                                property: "type"
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
                node: fl
            })
        }
    }

    checkUniqueInstanceNames(mdl: Model, accept: ValidationAcceptor) {
        const reportedInstances = new Set();
        mdl.instances.forEach(inst => {
            if (reportedInstances.has(inst.name)) {
                accept('error', `Instance has non-unique name '${inst.name}'.`, {node: inst, property: 'name'});
            }
            reportedInstances.add(inst.name);
        });
    }

    checkInstanceLoops(instLoop: InstanceLoop, accept: ValidationAcceptor) {
        if (instLoop.var.ref != undefined && instLoop.var.ref.dtype != undefined && instLoop.var.ref.type == undefined) {
            accept('error', `No class type - instance loops iterate over the elements of a reference of a class`, {
                node: instLoop,
                property: "var"
            })
        }
        if (instLoop.ref.ref != undefined) {
            const linkingReference = instLoop.ref.ref;
            if (instLoop.ivar.dtype != undefined && instLoop.ivar.type == undefined && linkingReference.type.ref != undefined) {
                accept('error', `Type error - loop variable must have type ${linkingReference.type.ref.name} (derived from reference ${linkingReference.name})`, {
                    node: instLoop,
                    property: "var"
                })
            } else if (instLoop.ivar.dtype == undefined && instLoop.ivar.type != undefined && instLoop.ivar.type.ref && linkingReference.type.ref != undefined) {
                if (linkingReference.type.ref != instLoop.ivar.type.ref) {
                    accept('error', `Type error - loop variable must have type ${linkingReference.type.ref.name} (derived from reference ${linkingReference.name})`, {
                        node: instLoop,
                        property: "var"
                    })
                }
            }
        }
    }

    checkArithExprOperations(expr: ArithExpr, accept: ValidationAcceptor) {
        if (isBinaryExpression(expr)) {
            if (!(ModelModelingLanguageUtils.isNumberArithExpr(expr.left) && ModelModelingLanguageUtils.isNumberArithExpr(expr.right))) {
                if ((ModelModelingLanguageUtils.isNumberArithExpr(expr.left) && ModelModelingLanguageUtils.isStringArithExpr(expr.right)) || (ModelModelingLanguageUtils.isStringArithExpr(expr.left) && ModelModelingLanguageUtils.isNumberArithExpr(expr.right))) {
                    if (!(expr.operator == "*" || expr.operator == "+")) {
                        accept('error', `Invalid arithmetic operation | Allowed operations for strings and numbers are: ["*", "+"]`, {
                            node: expr
                        })
                    }
                } else if (ModelModelingLanguageUtils.isStringArithExpr(expr.left) && ModelModelingLanguageUtils.isStringArithExpr(expr.right)) {
                    if (expr.operator != "+") {
                        accept('error', `Invalid arithmetic operation | Only string concatenation with operator "+" allowed`, {
                            node: expr
                        })
                    }
                } else {
                    accept('error', `Invalid arithmetic operation`, {
                        node: expr
                    })
                }
            }
        }
    }
}

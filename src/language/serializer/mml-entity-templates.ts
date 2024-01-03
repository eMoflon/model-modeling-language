import {
    Attribute,
    AttributeModifiers,
    Class,
    CReference,
    Enum,
    EnumEntry,
    Interface,
    isAttribute,
    isAttributeModifiers,
    isClass,
    isCReference,
    isEnum,
    isEnumValueExpr,
    isInterface,
    isReferenceModifiers,
    Model,
    Multiplicity,
    Package,
    ReferenceModifiers
} from "../generated/ast.js";
import {MmlReferenceStorage} from "./mml-reference-storage.js";
import {ModelModelingLanguageUtils} from "../model-modeling-language-utils.js";
import {MmlSerializerContext} from "./mml-serializer-context.js";

/**
 * These dataclasses define the structure of the serialized metamodel output.
 * The metamodel is being precomputed and all references are resolved.
 */

export class AttributeEntity {
    readonly referenceId: string;
    readonly name: string;
    readonly type: string;
    readonly isEnumType: boolean;
    readonly hasDefaultValue: boolean;
    readonly defaultValue: string | boolean | number;
    readonly modifiers: ClassElementModifiers;

    constructor(attr: Attribute, referenceStorage: MmlReferenceStorage) {
        this.referenceId = referenceStorage.getNodeReferenceId(attr);
        this.name = attr.name;
        if (attr.type.ptype != undefined && attr.type.etype == undefined) {
            this.type = attr.type.ptype;
            this.isEnumType = false;
        } else if (attr.type.ptype == undefined && attr.type.etype != undefined) {
            this.type = referenceStorage.resolveReference(attr.type.etype);
            this.isEnumType = true;
        } else {
            this.type = "$$UNKNOWN$$"
            this.isEnumType = false;
        }
        if (attr.defaultValue == undefined) {
            this.hasDefaultValue = false;
            this.defaultValue = "";
        } else {
            this.hasDefaultValue = true;
            if (isEnumValueExpr(attr.defaultValue) && attr.defaultValue.val.ref != undefined) {
                this.defaultValue = referenceStorage.getNodeReferenceId(attr.defaultValue.val.ref)
            } else {
                this.defaultValue = new MmlSerializerContext().evaluateArithExpr(attr.defaultValue);
            }
        }
        this.modifiers = new ClassElementModifiers(attr.modifiers);
    }
}

export class AbstractClassEntity {
    readonly referenceId: string;
    readonly name: string;
    readonly isAbstract: boolean;
    readonly isInterface: boolean;
    readonly attributes: AttributeEntity[] = [];
    readonly references: ReferenceEntity[] = [];
    readonly extendsIds: string[] = [];
    readonly implementsIds: string[] = [];

    constructor(abstractClass: Class | Interface, referenceStorage: MmlReferenceStorage) {
        this.referenceId = referenceStorage.getNodeReferenceId(abstractClass);
        this.name = abstractClass.name
        if (isInterface(abstractClass)) {
            this.isAbstract = false;
            this.isInterface = true;
            abstractClass.extendedInterfaces.forEach(extInterface => this.extendsIds.push(referenceStorage.resolveReference(extInterface)));
        } else {
            this.isInterface = false;
            this.isAbstract = abstractClass.abstract;
            abstractClass.extendedClasses.forEach(extClasses => this.extendsIds.push(referenceStorage.resolveReference(extClasses)));
            abstractClass.implementedInterfaces.forEach(implInterfaces => this.implementsIds.push(referenceStorage.resolveReference(implInterfaces)));
        }
        abstractClass.body.forEach(statement => {
            if (isAttribute(statement)) {
                this.attributes.push(new AttributeEntity(statement, referenceStorage))
            } else if (isCReference(statement)) {
                this.references.push(new ReferenceEntity(statement, referenceStorage))
            }
        });
    }
}

export class ReferenceEntity {
    readonly referenceId: string;
    readonly name: string;
    readonly multiplicity: MultiplicityEntity;
    readonly type: string;
    readonly modifiers: ClassElementModifiers;
    readonly hasOpposite: boolean = false;
    readonly opposite: string = "";


    constructor(ref: CReference, referenceStorage: MmlReferenceStorage) {
        this.referenceId = referenceStorage.getNodeReferenceId(ref);
        this.name = ref.name;
        this.modifiers = new ClassElementModifiers(ref.modifiers);
        this.multiplicity = new MultiplicityEntity(ref.multiplicity)
        this.type = referenceStorage.resolveReference(ref.type);
        if (ref.opposite != undefined) {
            this.hasOpposite = true;
            this.opposite = referenceStorage.resolveReference(ref.opposite.reference);
        }
    }
}

export class MultiplicityEntity {
    readonly hasUpperBound: boolean = false;
    readonly lowerIsN: boolean = false;
    readonly lowerIsN0: boolean = false;
    readonly lower: number = 0;
    readonly upper: number = 0;
    readonly upperIsN: boolean = false;
    readonly upperIsN0: boolean = false;


    constructor(mult: Multiplicity | undefined) {
        if (mult == undefined) {
            return;
        }
        this.lowerIsN = mult.mult.n;
        this.lowerIsN0 = mult.mult.n_0;
        this.lower = mult.mult.num ?? 0;
        if (mult.upperMult != undefined) {
            this.hasUpperBound = true;
            this.upperIsN = mult.upperMult.n;
            this.upperIsN0 = mult.upperMult.n_0;
            this.upper = mult.upperMult.num ?? 0;
        }
    }
}

export class ClassElementModifiers {
    readonly readonly: boolean = false;
    readonly volatile: boolean = false;
    readonly transient: boolean = false;
    readonly unsettable: boolean = false;
    readonly derived: boolean = false;
    readonly unique: boolean = true;
    readonly ordered: boolean = true;
    readonly resolve: boolean = true;
    readonly containment: boolean = false;
    readonly id: boolean = false;


    constructor(mod: ReferenceModifiers | AttributeModifiers | undefined) {
        if (mod == undefined) {
            return;
        }
        this.readonly = (this.readonly || mod.readonly) && !mod.not_readonly;
        this.volatile = (this.volatile || mod.volatile) && !mod.not_volatile;
        this.transient = (this.transient || mod.transient) && !mod.not_transient;
        this.unsettable = (this.unsettable || mod.unsettable) && !mod.not_unsettable;
        this.derived = (this.derived || mod.derived) && !mod.not_derived;
        this.unique = (this.unique || mod.unique) && !mod.not_unique;
        this.ordered = (this.ordered || mod.ordered) && !mod.not_ordered;
        if (isReferenceModifiers(mod)) {
            this.resolve = (this.resolve || mod.resolve) && !mod.not_resolve;
            this.containment = (this.containment || mod.containment) && !mod.not_containment;
        }
        if (isAttributeModifiers(mod)) {
            this.id = (this.id || mod.id) && !mod.not_id;
        }
    }
}

export class EnumEntity {
    readonly referenceId: string;
    readonly name: string;
    readonly type: string;
    readonly entries: EnumEntryEntity[] = [];


    constructor(enm: Enum, referenceStorage: MmlReferenceStorage) {
        this.referenceId = referenceStorage.getNodeReferenceId(enm);
        this.name = enm.name;
        this.type = ModelModelingLanguageUtils.getEnumType(enm);
        enm.entries.forEach(entry => this.entries.push(new EnumEntryEntity(entry, referenceStorage)));
    }
}

export class EnumEntryEntity {
    readonly referenceId: string;
    readonly name: string;
    readonly hasDefaultValue: boolean = false;
    readonly defaultValue: string | boolean | number = "";

    constructor(ee: EnumEntry, referenceStorage: MmlReferenceStorage) {
        this.referenceId = referenceStorage.getNodeReferenceId(ee);
        this.name = ee.name;
        if (ee.value != undefined) {
            this.hasDefaultValue = true;
            this.defaultValue = ee.value.value;
        }
    }
}

export class PackageEntity {
    readonly referenceId: string;
    readonly name: string;
    readonly abstractClasses: AbstractClassEntity[] = [];
    readonly enums: EnumEntity[] = [];
    readonly subPackages: PackageEntity[] = [];


    constructor(pckg: Package, referenceStorage: MmlReferenceStorage) {
        this.referenceId = referenceStorage.getNodeReferenceId(pckg);
        this.name = pckg.name;
        pckg.subPackages.forEach(subPackage => this.subPackages.push(new PackageEntity(subPackage, referenceStorage)));
        pckg.body.forEach(abstractElement => {
            if (isEnum(abstractElement)) {
                this.enums.push(new EnumEntity(abstractElement, referenceStorage));
            } else if (isClass(abstractElement) || isInterface(abstractElement)) {
                this.abstractClasses.push(new AbstractClassEntity(abstractElement, referenceStorage));
            }
        })
    }
}

export class SerializedModel {
    readonly packages: PackageEntity[] = [];


    constructor(model: Model, referenceStorage: MmlReferenceStorage) {
        model.packages.forEach(pckg => this.packages.push(new PackageEntity(pckg, referenceStorage)));
    }
}
import {expandToNode as toNode, type Generated, joinToNode as join} from "langium";
import {
    AbstractClassEntity,
    AttributeEntity,
    ClassElementModifiers,
    EnumEntity,
    EnumEntryEntity,
    MultiplicityEntity,
    PackageEntity,
    ReferenceEntity,
    SerializedModel
} from "../serializer/mml-entity-templates.js";

function joinWithExtraNL<T>(content: T[], toString: (e: T) => Generated): Generated {
    return join(content, toString, {appendNewLineIfNotEmpty: true});
}

function setSpacedKeywordIf(keyword: string, condition: boolean): Generated {
    if (condition) {
        return toNode`${keyword} `;
    }
    return toNode``;
}

export function deserializeModel(model: SerializedModel): Generated {
    return toNode`${joinWithExtraNL(model.packages, pkg => deserializePackage(pkg))}`
}

function deserializePackage(packageEntity: PackageEntity): Generated {
    return toNode`
        package ${packageEntity.name} {
            ${joinWithExtraNL(packageEntity.enums, x => deserializeEnum(x))}
            ${joinWithExtraNL(packageEntity.abstractClasses, x => deserializeAbstractClassEntity(x))}
            ${joinWithExtraNL(packageEntity.subPackages, x => deserializePackage(x))}
        }
        `
}

function deserializeAbstractClassEntity(ace: AbstractClassEntity): Generated {
    return toNode`
        ${setSpacedKeywordIf("abstract", ace.isAbstract)}${setSpacedKeywordIf("interface", ace.isInterface)}class ${ace.name} ${setSpacedKeywordIf("extends " + ace.extendsIds.join(","), ace.extendsIds.length > 0)}${setSpacedKeywordIf("implements " + ace.implementsIds.join(","), ace.implementsIds.length > 0)}{
            ${joinWithExtraNL(ace.attributes, x => deserializeAttribute(x))}
            ${joinWithExtraNL(ace.references, x => deserializeReference(x))}
        }
        `
}

function deserializeAttribute(attribute: AttributeEntity): Generated {
    if (attribute.hasDefaultValue) {
        return toNode`
        attribute ${attribute.type} ${attribute.name} = ${attribute.defaultValue}${deserializeClassElementModifiers(attribute.modifiers)};
        `;
    } else {
        return toNode`
        attribute ${attribute.type} ${attribute.name}${deserializeClassElementModifiers(attribute.modifiers)};
        `;
    }
}

function deserializeClassElementModifiers(cem: ClassElementModifiers): Generated {
    const modifiers: string[] = [cem.readonly ? "readonly" : "", cem.volatile ? "volatile" : "", cem.transient ? "transient" : "", cem.unsettable ? "unsettable" : "", cem.derived ? "derived" : "", cem.unique ? "unique" : "", cem.ordered ? "ordered" : "", cem.resolve ? "resolve" : "", cem.id ? "id" : ""].filter(x => x != "");
    return modifiers.length == 0 ? toNode`` : toNode` {${modifiers.join(" ")}}`;
}

function deserializeReference(reference: ReferenceEntity): Generated {
    if (reference.hasOpposite) {
        return toNode`
        @opposite ${reference.opposite}
        reference ${reference.type}${deserializeMultiplicity(reference.multiplicity)} ${reference.name}${deserializeClassElementModifiers(reference.modifiers)};`;
    } else {
        return toNode`reference ${reference.type}${deserializeMultiplicity(reference.multiplicity)} ${reference.name}${deserializeClassElementModifiers(reference.modifiers)};`;
    }
}

function deserializeMultiplicity(mult: MultiplicityEntity): Generated {
    const lower: string = mult.lowerIsN0 ? "*" : mult.lowerIsN ? "+" : mult.lower.toString();
    const upper: string = mult.upperIsN0 ? "*" : mult.upperIsN ? "+" : mult.upper.toString();
    if (mult.hasUpperBound) {
        return toNode`[${lower}..${upper}]`;
    } else {
        return toNode`[${lower}]`;
    }
}

function deserializeEnum(enumEntity: EnumEntity): Generated {
    return toNode`
    enum ${enumEntity.name} {
        ${join(enumEntity.entries, x => deserializeEnumEntryEntity(x), {separator: ",", appendNewLineIfNotEmpty: true})}
    }
    `
}

function deserializeEnumEntryEntity(entry: EnumEntryEntity): Generated {
    if (entry.hasDefaultValue) {
        return toNode`${entry.name} = ${entry.defaultValue}`
    } else {
        return toNode`${entry.name}`
    }
}
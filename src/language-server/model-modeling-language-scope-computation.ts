import {AstNodeDescription, DefaultScopeComputation, LangiumDocument, streamAllContents} from "langium";
import {isClass, isCReference, isEnum, isInterface, isPackage} from "./generated/ast";
import {ModelModelingLanguageUtils} from "./model-modeling-language-utils";

export class ModelModelingLanguageScopeComputation extends DefaultScopeComputation {

    override async computeExports(document: LangiumDocument): Promise<AstNodeDescription[]> {
        const exportedDescriptions: AstNodeDescription[] = [];
        for (const childNode of streamAllContents(document.parseResult.value)) {
            if (isCReference(childNode)) {
                const fullyQualifiedName = ModelModelingLanguageUtils.getFullyQualifiedRefName(childNode, childNode.name);
                // `descriptions` is our `AstNodeDescriptionProvider` defined in `DefaultScopeComputation`
                // It allows us to easily create descriptions that point to elements using a name.
                exportedDescriptions.push(this.descriptions.createDescription(childNode, fullyQualifiedName, document));
            } else if (isPackage(childNode) || isClass(childNode) || isInterface(childNode) || isEnum(childNode)) {
                const fullyQualifiedName = ModelModelingLanguageUtils.getQualifiedClassName(childNode, childNode.name);
                // `descriptions` is our `AstNodeDescriptionProvider` defined in `DefaultScopeComputation`
                // It allows us to easily create descriptions that point to elements using a name.
                exportedDescriptions.push(this.descriptions.createDescription(childNode, fullyQualifiedName, document));
            }
        }
        return exportedDescriptions;
    }
}
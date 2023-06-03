import {
    AstNode,
    AstNodeDescription,
    DefaultScopeProvider,
    getContainerOfType,
    LangiumDocument,
    ReferenceInfo,
    Scope
} from "langium";
import {isModel} from "./generated/ast";
import {URI} from "vscode-uri";
import {ModelModelingLanguageServices} from "./model-modeling-language-module";

export class ModelModelingLanguageScopeProvider extends DefaultScopeProvider {
    services: ModelModelingLanguageServices;

    constructor(services: ModelModelingLanguageServices) {
        super(services);
        this.services = services;
    }

    protected override getGlobalScope(referenceType: string, _context: ReferenceInfo): Scope {
        const modl = getContainerOfType(_context.container, isModel);
        if (!modl) {
            return super.getGlobalScope(referenceType, _context);
        }

        const globalScope: Scope = super.getGlobalScope(referenceType, _context);

        const aliasDescriptions: AstNodeDescription[] = [];
        modl.imports.forEach(ip => {
            const importUri = URI.parse(ip.target);
            ip.aliases.forEach(ipa => {
                globalScope.getAllElements()
                    .filter(x => x.name == ipa.name || x.name.startsWith(ipa.name))
                    .filter(astNodeDesc => astNodeDesc.documentUri.path == importUri.path)
                    .forEach(targetAstNodeDescription => {
                        if (targetAstNodeDescription != undefined) {
                            const targetAstNode = this.getAstNodeByPath(targetAstNodeDescription);
                            if (targetAstNode != null) {
                                const updatedName = targetAstNodeDescription.name.replace(ipa.name, ipa.alias);
                                aliasDescriptions.push(this.descriptions.createDescription(targetAstNode, updatedName));
                            } else {
                                console.warn(`[AliasResolution] TargetAstNode is null!`)
                            }
                        } else {
                            console.warn(`[AliasResolution] Could not resolve ${ipa.name}!`)
                        }
                    });
            })
        })

        return this.createScope(aliasDescriptions, globalScope);
    }

    getAstNodeByPath(nodeDescription: AstNodeDescription): AstNode | undefined {
        const targetDocUri: URI = nodeDescription.documentUri;
        if (!this.services.shared.workspace.LangiumDocuments.hasDocument(targetDocUri)) {
            console.error("This document is not managed by langium services!")
            return undefined;
        }
        const targetDoc: LangiumDocument = this.services.shared.workspace.LangiumDocuments.getOrCreateDocument(targetDocUri);
        return this.services.workspace.AstNodeLocator.getAstNode(targetDoc.parseResult.value, nodeDescription.path);
    }
}
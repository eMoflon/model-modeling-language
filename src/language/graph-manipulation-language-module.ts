import type {LangiumServices, Module, PartialLangiumServices} from 'langium';
import {GraphManipulationLanguageScopeProvider} from "./graph-manipulation-language-scope-provider.js";
import {GraphManipulationLanguageCompletionProvider} from "./graph-manipulation-language-completion-provider.js";
import {GraphManipulationLanguageSemanticTokenProvider} from "./graph-manipulation-language-semantic-token-provider.js";


/**
 * Declaration of custom services - add your own service classes here.
 */
export type GraphManipulationLanguageAddedServices = {
    // validation: {
    //     GraphManipulationLanguageValidator: GraphManipulationLanguageValidator
    // },
    references: {
        ScopeProvider: GraphManipulationLanguageScopeProvider
    },
    lsp: {
        CompletionProvider: GraphManipulationLanguageCompletionProvider,
        //     Formatter: GraphManipulationLanguageFormatter,
        SemanticTokenProvider: GraphManipulationLanguageSemanticTokenProvider
    }
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type GraphManipulationLanguageServices = LangiumServices & GraphManipulationLanguageAddedServices

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const GraphManipulationLanguageModule: Module<GraphManipulationLanguageServices, PartialLangiumServices & GraphManipulationLanguageAddedServices> = {
    // validation: {
    //     GraphManipulationLanguageValidator: (services) => new GraphManipulationLanguageValidator(services),
    // },
    references: {
        ScopeProvider: (services) => new GraphManipulationLanguageScopeProvider(services),
    },
    lsp: {
        CompletionProvider: (services) => new GraphManipulationLanguageCompletionProvider(services),
        //     Formatter: () => new GraphManipulationLanguageFormatter(),
        SemanticTokenProvider: (services) => new GraphManipulationLanguageSemanticTokenProvider(services)
    }
};
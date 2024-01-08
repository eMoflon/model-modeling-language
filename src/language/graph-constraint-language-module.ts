import type {LangiumServices, Module, PartialLangiumServices} from 'langium';
import {GraphConstraintLanguageValidator} from "./graph-constraint-language-validator.js";
import {GraphConstraintLanguageCompletionProvider} from "./graph-constraint-language-completion-provider.js";
import {GraphConstraintLanguageFormatter} from "./graph-constraint-language-formatter.js";
import {GraphConstraintLanguageSemanticTokenProvider} from "./graph-constraint-language-semantic-token-provider.js";
import {GraphConstraintLanguageScopeProvider} from "./graph-constraint-language-scope-provider.js";

/**
 * Declaration of custom services - add your own service classes here.
 */
export type GraphConstraintLanguageAddedServices = {
    validation: {
        GraphConstraintLanguageValidator: GraphConstraintLanguageValidator
    },
    references:{
      ScopeProvider: GraphConstraintLanguageScopeProvider
    },
    lsp: {
        CompletionProvider: GraphConstraintLanguageCompletionProvider,
        Formatter: GraphConstraintLanguageFormatter,
        SemanticTokenProvider: GraphConstraintLanguageSemanticTokenProvider
    }
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type GraphConstraintLanguageServices = LangiumServices & GraphConstraintLanguageAddedServices

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const GraphConstraintLanguageModule: Module<GraphConstraintLanguageServices, PartialLangiumServices & GraphConstraintLanguageAddedServices> = {
    validation: {
        GraphConstraintLanguageValidator: (services) => new GraphConstraintLanguageValidator(services),
    },
    references: {
        ScopeProvider: (services) => new GraphConstraintLanguageScopeProvider(services),
    },
    lsp: {
        CompletionProvider: (services) => new GraphConstraintLanguageCompletionProvider(services),
        Formatter: () => new GraphConstraintLanguageFormatter(),
        SemanticTokenProvider: (services) => new GraphConstraintLanguageSemanticTokenProvider(services)
    }
};
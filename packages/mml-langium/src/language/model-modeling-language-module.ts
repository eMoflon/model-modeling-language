import type {
    LangiumServices,
    Module,
    PartialLangiumServices
} from 'langium';
import {ModelModelingLanguageValidator} from './model-modeling-language-validator.js';
import {ModelModelingLanguageScopeComputation} from "./model-modeling-language-scope-computation.js";
import {ModelModelingLanguageScopeProvider} from "./model-modeling-language-scope-provider.js";
import {ModelModelingLanguageSemanticTokenProvider} from "./model-modeling-language-semantic-token-provider.js";
import {ModelModelingLanguageCodeActionProvider} from "./model-modeling-language-code-action-provider.js";
import {ModelModelingLanguageFormatter} from "./model-modeling-language-formatter.js";
import {ModelModelingLanguageCompletionProvider} from "./model-modeling-language-completion-provider.js";

/**
 * Declaration of custom services - add your own service classes here.
 */
export type ModelModelingLanguageAddedServices = {
    validation: {
        ModelModelingLanguageValidator: ModelModelingLanguageValidator
    },
    references: {
        ScopeComputation: ModelModelingLanguageScopeComputation,
        ScopeProvider: ModelModelingLanguageScopeProvider,
    },
    lsp: {
        SemanticTokenProvider: ModelModelingLanguageSemanticTokenProvider,
        CodeActionProvider: ModelModelingLanguageCodeActionProvider,
        Formatter: ModelModelingLanguageFormatter,
        CompletionProvider: ModelModelingLanguageCompletionProvider
    }
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type ModelModelingLanguageServices = LangiumServices & ModelModelingLanguageAddedServices

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const ModelModelingLanguageModule: Module<ModelModelingLanguageServices, PartialLangiumServices & ModelModelingLanguageAddedServices> = {
    validation: {
        ModelModelingLanguageValidator: (services) => new ModelModelingLanguageValidator(services),
    },
    references: {
        ScopeComputation: (services) => new ModelModelingLanguageScopeComputation(services),
        ScopeProvider: (services) => new ModelModelingLanguageScopeProvider(services),
    },
    lsp: {
        SemanticTokenProvider: (services) => new ModelModelingLanguageSemanticTokenProvider(services),
        CodeActionProvider: (services) => new ModelModelingLanguageCodeActionProvider(services),
        Formatter: () => new ModelModelingLanguageFormatter(),
        CompletionProvider: (services) => new ModelModelingLanguageCompletionProvider(services)
    }
};

import type {
    LangiumServices,
    Module,
    PartialLangiumServices
} from 'langium';
import {GraphConstraintLanguageValidator} from "./graph-constraint-language-validator.js";

/**
 * Declaration of custom services - add your own service classes here.
 */
export type GraphConstraintLanguageAddedServices = {
    validation: {
        GraphConstraintLanguageValidator: GraphConstraintLanguageValidator
    },
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
};
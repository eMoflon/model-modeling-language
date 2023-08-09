import {describe, expect, test} from "vitest";
import {getValidation} from "./testutils";
import {IssueCodes} from "../src/language-server/model-modeling-language-validator";


describe('Enum validator tests', () => {
    test('Validator should notice non-unique enum type 1', async () => {
        const validationResult = await getValidation(`
        package A {
            enum A {
                A = "0",
                B = 1
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.EnumTypeNotUnique);
    });

    test('Validator should notice non-unique enum type 2', async () => {
        const validationResult = await getValidation(`
        package A {
            enum A {
                A = true,
                B = 1
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.EnumTypeNotUnique);
    });

    test('Validator should notice non-unique enum type 3', async () => {
        const validationResult = await getValidation(`
        package A {
            enum A {
                A = "true",
                B = false
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.EnumTypeNotUnique);
    });

    test('Validator should succeed 1', async () => {
        const validationResult = await getValidation(`
        package A {
            enum A {
                A,
                B
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should succeed 2', async () => {
        const validationResult = await getValidation(`
        package A {
            enum A {
                A = 1,
                B = 2
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should succeed 3', async () => {
        const validationResult = await getValidation(`
        package A {
            enum A {
                A = "A",
                B = "B"
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should succeed 4', async () => {
        const validationResult = await getValidation(`
        package A {
            enum A {
                A,
                B = 1
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });
});
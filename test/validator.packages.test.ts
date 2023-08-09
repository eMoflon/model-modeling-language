import {describe, expect, test} from "vitest";
import {getValidation} from "./testutils";
import {IssueCodes} from "../src/language-server/model-modeling-language-validator";


describe('Package validator tests', () => {
    test('Validator should notice non-unique package name', async () => {
        const validationResult = await getValidation(`
        package A {
        }
        package A {
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.PackageNameNotUnique);
    });

    test('Validator should notice non-unique sub-package names', async () => {
        const validationResult = await getValidation(`
        package A {
            package A {
            }
            package A {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.SubPackageNameNotUnique);
    });

    test('Validator should notice non-unique package and sub-package names', async () => {
        const validationResult = await getValidation(`
        package A {
            package A {
            }
            package A {
            }
        }
        package A {
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.PackageNameNotUnique);
        expect(validationResult.diagnostics.at(1).code).toEqual(IssueCodes.SubPackageNameNotUnique);
    });

    test('Validator should notice non-unique element names 1', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
            }
            class B {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ElementNameNotUnique);
    });

    test('Validator should notice non-unique element names 2', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
            }
            interface B {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ElementNameNotUnique);
    });

    test('Validator should notice non-unique element names 3', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
            }
            enum B {
                C
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ElementNameNotUnique);
    });

    test('Validator should notice non-unique element names 4', async () => {
        const validationResult = await getValidation(`
        package A {
            interface B {
            }
            interface B {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ElementNameNotUnique);
    });

    test('Validator should notice non-unique element names 5', async () => {
        const validationResult = await getValidation(`
        package A {
            abstract class B {
            }
            enum B {
                C
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ElementNameNotUnique);
    });

    test('Validator should notice non-unique element names 6', async () => {
        const validationResult = await getValidation(`
        package A {
            abstract class B {
            }
            interface B {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ElementNameNotUnique);
    });

    test('Validator should notice non-unique element names in subpackage 1', async () => {
        const validationResult = await getValidation(`
        package A {
            package A {
                abstract class B {
                }
                interface B {
                }
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ElementNameNotUnique);
    });

    test('Validator should notice non-unique element names in subpackage 2', async () => {
        const validationResult = await getValidation(`
        package A {
            package A {
                class B {
                }
                enum B {
                    C
                }
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ElementNameNotUnique);
    });

    test('Validator succeed', async () => {
        const validationResult = await getValidation(`
        package A {
            package A {
                class A {
                }
                class B {
                }
                interface C {
                }
            }
            package B {
            }
        }
        package B {
            package C {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });
});
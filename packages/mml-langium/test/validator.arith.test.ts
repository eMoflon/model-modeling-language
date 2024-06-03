import {describe, expect, test} from "vitest";
import {expectErrorCode, getValidation} from "./testutils.js";
import {IssueCodes} from "../src/language/model-modeling-language-validator.js";

describe('ArithExpr validator tests', () => {
    test('Validator should compute correct string concat type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = "The answer" + " is 42";
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should compute correct string and int concat type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = "The answer" + " is " + 42;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should compute correct string and enum concat type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = "This is " + A.C::X;
            }
            
            enum C {
                X = "good",
                Y = "bad"
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should compute correct int addition type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute int x = 40 + 2;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should compute correct double addition type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute double x = 4.1 + 0.1;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should compute correct int and double addition type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute double x = 4 + 0.2;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should compute correct int multiplication type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute int x = 5 * 3;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should compute correct int subtract type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute int x = 44 - 2;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should compute correct double division type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute double x = 15.0 / 3.0;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });

    test('Validator should notice unsupported operation 1', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = "AB" - "CD";
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 2', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = "AB" / "CD";
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 3', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = 5 - "A";
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 4', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = 5 / "A";
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 5', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = 5 * true;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 6', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = false / 15;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 7', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = "What is " + 5 + "times" + true;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 8', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = "Is this " + true;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 9', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = true || false;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 10', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = true && false;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 11', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = true == false;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 12', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = true != false;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 13', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = 1 < 3;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 14', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = 1 <= 3;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 15', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = 1 > 3;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 16', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = 1 >= 3;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should notice unsupported operation 17', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = !true;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.ExpressionUnsupportedOperation);
    });

    test('Validator should compute correct multiplied string type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = 5 * "nice";
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });
});
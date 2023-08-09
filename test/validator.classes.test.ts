import {describe, expect, test} from "vitest";
import {getValidation} from "./testutils";
import {IssueCodes} from "../src/language-server/model-modeling-language-validator";


describe('Class validator tests', () => {
    test('Validator should notice self inheritance', async () => {
        const validationResult = await getValidation(`
        package A {
            class B extends B{
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ClassSelfExtension);
    });

    test('Validator should notice non-unique extends 1', async () => {
        const validationResult = await getValidation(`
        package A {
            class B extends C, C {
            }
            class C {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.DuplicateClassExtension);
    });

    test('Validator should notice non-unique extends 2', async () => {
        const validationResult = await getValidation(`
        package A {
            class B extends C, D, C {
            }
            class C {
            }
            class D {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.DuplicateClassExtension);
    });

    test('Validator should notice interface self extends 1', async () => {
        const validationResult = await getValidation(`
        package A {
            interface C extends C {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.InterfaceSelfExtension);
    });

    test('Validator should notice interface self extends 2', async () => {
        const validationResult = await getValidation(`
        package A {
            interface C extends D, C {
            }
            interface D {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.InterfaceSelfExtension);
    });

    test('Validator should notice non-unique implements 1', async () => {
        const validationResult = await getValidation(`
        package A {
            class B implements C, C {
            }
            interface C {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.DuplicateClassImplements);
    });

    test('Validator should notice non-unique implements 2', async () => {
        const validationResult = await getValidation(`
        package A {
            class B implements C, D, C {
            }
            interface C {
            }
            interface D {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.DuplicateClassImplements);
    });

    test('Validator should notice non-unique class statement names 1', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x;
                attribute string x;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ClassStatementNameNotUnique);
    });

    test('Validator should notice non-unique class statement names 2', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                reference C x;
                reference C x;
            }
            class C {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(3);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ClassStatementNameNotUnique);
        expect(validationResult.diagnostics.at(1).code).toEqual(IssueCodes.OppositeAnnotationMissing);
        expect(validationResult.diagnostics.at(2).code).toEqual(IssueCodes.OppositeAnnotationMissing);
    });

    test('Validator should notice non-unique class statement names 3', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x;
                reference C x;
            }
            class C {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.ClassStatementNameNotUnique);
        expect(validationResult.diagnostics.at(1).code).toEqual(IssueCodes.OppositeAnnotationMissing);
    });

    test('Validator should notice non-unique interface statement names 1', async () => {
        const validationResult = await getValidation(`
        package A {
            interface B {
                attribute string x;
                attribute string x;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.InterfaceStatementNameNotUnique);
    });

    test('Validator should notice non-unique interface statement names 2', async () => {
        const validationResult = await getValidation(`
        package A {
            interface B {
                reference C x;
                reference C x;
            }
            class C {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(3);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.InterfaceStatementNameNotUnique);
        expect(validationResult.diagnostics.at(1).code).toEqual(IssueCodes.OppositeAnnotationMissing);
        expect(validationResult.diagnostics.at(2).code).toEqual(IssueCodes.OppositeAnnotationMissing);
    });

    test('Validator should notice non-unique interface statement names 3', async () => {
        const validationResult = await getValidation(`
        package A {
            interface B {
                attribute string x;
                reference C x;
            }
            class C {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.InterfaceStatementNameNotUnique);
        expect(validationResult.diagnostics.at(1).code).toEqual(IssueCodes.OppositeAnnotationMissing);
    });

    test('Validator should notice invalid multiplicities 1', async () => {
        const validationResult = await getValidation(`
        package A {
            interface B {
                reference C[+..3] x;
            }
            class C {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.InvalidMultiplicity);
        expect(validationResult.diagnostics.at(1).code).toEqual(IssueCodes.OppositeAnnotationMissing);
    });

    test('Validator should notice invalid multiplicities 2', async () => {
        const validationResult = await getValidation(`
        package A {
            interface B {
                reference C[*..3] x;
            }
            class C {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.InvalidMultiplicity);
        expect(validationResult.diagnostics.at(1).code).toEqual(IssueCodes.OppositeAnnotationMissing);
    });

    test('Validator should notice invalid multiplicities 3', async () => {
        const validationResult = await getValidation(`
        package A {
            interface B {
                reference C[5..1] x;
            }
            class C {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.InvalidMultiplicity);
        expect(validationResult.diagnostics.at(1).code).toEqual(IssueCodes.OppositeAnnotationMissing);
    });

    test('Validator should notice missing opposites opposite annotation', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                @opposite A.C::y
                reference C[1] x;
            }
            class C {
                reference B[1] y;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.OppositeAnnotationMissing);
        expect(validationResult.diagnostics.at(1).code).toEqual(IssueCodes.OppositesOppositeAnnotationMissing);
    });

    test('Validator should notice non-matching opposite annotations', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                @opposite A.C::y
                reference C[1] x;
            }
            class C {
                @opposite A.D::z
                reference B[1] y;
            }
            class D {
                @opposite A.C::y
                reference B[1] z;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.OppositeAnnotationDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 1', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = 123;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 2', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = 12.3;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 3', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = false;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 4', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute string x = A.C::X;
            }
            enum C {
                X = 1,
                Y = 2
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 5', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute int x = "Test";
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 6', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute int x = 4.2;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 7', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute int x = false;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 8', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute int x = A.C::X;
            }
            enum C {
                X = "1",
                Y = "2"
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 9', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute double x = "Test";
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 10', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute double x = true;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 11', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute double x = A.C::X;
            }
            enum C {
                X = "1",
                Y = "2"
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 12', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = "Test";
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 13', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = 4.2;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 14', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = 42;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should notice non-matching attribute type 15', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool x = A.C::X;
            }
            enum C {
                X = "1",
                Y = "2"
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expect(validationResult.diagnostics.at(0).code).toEqual(IssueCodes.AttributeTypeDoesNotMatch);
    });

    test('Validator should succeed', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool a = true;
                attribute bool b = false;
                attribute string c = "ABC";
                attribute int d = 2;
                attribute double e = 42;
                attribute double f = 4.2;
                attribute A.C g = A.C::Q;
                @opposite A.D::x
                reference A.D x;
                @opposite A.E::x
                reference A.E[*] y;
            }
            enum C {
                Q = true,
                W = false
            }
            class D {
                @opposite A.B::x
                reference A.B[+] x; 
            }
            class E {
                @opposite A.B::y
                reference A.B[1..5] x;
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });
});
import {describe, expect, test} from "vitest";
import {expectErrorCode, getValidation} from "./testutils.js";
import {IssueCodes} from "../src/language/model-modeling-language-validator.js";

describe('Macro validator tests', () => {
    test('Validator should notice non-unique macro name', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool a = true;
                @opposite A.C::x
                reference A.C x;
            }
            class C {
                @opposite A.B::x
                reference A.B[*] x; 
            }
        }    
        macro test[]{
        }
        
        macro test[]{
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.MacroNameNotUnique);
    });

    test('Validator should notice non-unique macro variable name 1', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool a = true;
                @opposite A.C::x
                reference A.C x;
            }
            class C {
                @opposite A.B::x
                reference A.B[*] x; 
            }
        }    
        macro test[]{
            A.B x {
            }
            
            A.C x {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.MacroVariableNameNotUnique);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.MacroVariableNameNotUnique);
    });

    test('Validator should notice non-unique macro variable name 2', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool a = true;
                @opposite A.C::x
                reference A.C x;
            }
            class C {
                @opposite A.B::x
                reference A.B[*] x; 
            }
        }    
        macro test[A.B x]{
            A.B x {
            }
            
            A.C y {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.MacroVariableNameNotUnique);
    });

    test('Validator should notice non-unique macro variable name 3', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool a = true;
                @opposite A.C::x
                reference A.C x;
            }
            class C {
                @opposite A.B::x
                reference A.B[*] x; 
            }
        }    
        macro test[A.B x]{
            x {
            }
            
            A.C x {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.MacroVariableNameNotUnique);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.MacroVariableNameNotUnique);
    });

    test('Validator should notice non-unique macro variable name 4', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool a = true;
                @opposite A.C::x
                reference A.C x;
            }
            class C {
                @opposite A.B::x
                reference A.B[*] x; 
            }
        }    
        macro test[A.B x, A.C x]{
            A.B x {
            }
            
            A.C x {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(4);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.MacroVariableNameNotUnique);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.MacroVariableNameNotUnique);
        expectErrorCode(validationResult, 2).toEqual(IssueCodes.MacroVariableNameNotUnique);
        expectErrorCode(validationResult, 3).toEqual(IssueCodes.MacroVariableNameNotUnique);
    });

    test('Validator should notice invalid macro attribute statement type 1', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool a = true;
                attribute string c = "ABC";
                attribute int d = 2;
                @opposite A.C::x
                reference A.C x;
            }
            class C {
                @opposite A.B::x
                reference A.B[*] x; 
            }
        }    
        macro test[A.B x]{
            x {
                a = "false"
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.MacroAttributeTypeDoesNotMatch);
    });

    test('Validator should notice invalid macro attribute statement type 2', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool a = true;
                attribute string c = "ABC";
                attribute int d = 2;
                @opposite A.C::x
                reference A.C x;
            }
            class C {
                @opposite A.B::x
                reference A.B[*] x; 
            }
        }    
        macro test[A.B x]{
            x {
                c = 123
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.MacroAttributeTypeDoesNotMatch);
    });

    test('Validator should notice invalid macro attribute statement type 3', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool a = true;
                attribute string c = "ABC";
                attribute int d = 2;
                @opposite A.C::x
                reference A.C x;
            }
            class C {
                @opposite A.B::x
                reference A.B[*] x; 
            }
        }
        macro test[A.B x]{
            x {
                d = "xyz"
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.MacroAttributeTypeDoesNotMatch);
    });

    test('Validator should notice invalid macro attribute statement type 4', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute A.D e = A.D::Q;
                @opposite A.C::x
                reference A.C x;
            }
            class C {
                @opposite A.B::x
                reference A.B[*] x; 
            }
            enum D {
                Q = true,
                W = false
            }
        }    
        macro test[A.B x]{
            x {
                e = false
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.MacroAttributeTypeDoesNotMatch);
    });

    test('Validator should notice macro assignment on attribute variable', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool a = true;
                @opposite A.C::x
                reference A.C x;
            }
            class C {
                @opposite A.B::x
                reference A.B[*] x; 
            }
        }    
        macro test[A.B x, int y]{
            x {
                x -> y
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.MacroAssignReferenceTypeDoesNotMatch);
    });

    test('Validator should notice non-matching macro assignment class type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                attribute bool a = true;
                @opposite A.C::x
                reference A.C x;
            }
            class C {
                @opposite A.B::x
                reference A.B[*] x; 
            }
        }    
        macro test[A.B x]{
            x {
                x -> y 
            }
            A.B y {
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.MacroAssignReferenceTypeDoesNotMatch);
    });

    test('Validator should notice instantiation of abstract class', async () => {
        const validationResult = await getValidation(`
        package A {
            abstract class B {
                attribute bool a = true;
            }
        }
        macro test[]{
            A.B x {
                a = false
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.InstantiationOfAbstractClass);
    });

    test('Validator should notice instantiation of interface', async () => {
        const validationResult = await getValidation(`
        package A {
            interface B {
                attribute bool a = true;
            }
        }
        macro test[]{
            A.B x {
                a = false
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(undefined);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.InstantiationOfInterface);
    });

    test('Validator should notice instantiation of primitive type', async () => {
        const validationResult = await getValidation(`
        macro test[]{
            int x {
                a = false
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(undefined);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.InstantiationOfPrimitiveType);
    });

    test('Validator should notice instantiation of enum class', async () => {
        const validationResult = await getValidation(`
        package A {
            enum B {
                A,
                B
            }
        }
        macro test[]{
            A.B x {
                a = false
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(undefined);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.InstantiationOfEnum);
    });

    test('Validator should notice usage of abstract type', async () => {
        const validationResult = await getValidation(`
        package A {
            abstract class B {
                attribute bool a = true;
            }
        }
        macro test[A.B x]{
            x {
                a = false
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.InstantiationOfAbstractClass);
    });

    test('Validator should notice usage of interface', async () => {
        const validationResult = await getValidation(`
        package A {
            interface B {
                attribute bool a = true;
            }
        }
        macro test[A.B x]{
            x {
                a = false
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(undefined);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.InstantiationOfInterface);
    });

    test('Validator should notice usage of primitive type', async () => {
        const validationResult = await getValidation(`
        macro test[int x]{
            x {
                a = false
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(undefined);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.InstantiationOfPrimitiveType);
    });

    test('Validator should notice usage of enum class', async () => {
        const validationResult = await getValidation(`
        package A {
            enum B {
                A,
                B
            }
        }
        macro test[A.B x]{
            x {
                a = false
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(2);
        expectErrorCode(validationResult, 0).toEqual(undefined);
        expectErrorCode(validationResult, 1).toEqual(IssueCodes.InstantiationOfEnum);
    });

    test('Validator should succeed', async () => {
        const validationResult = await getValidation(`
        package A {
            class B extends SuperAbst{
                attribute bool a = true;
                attribute string c = "ABC";
                attribute int d = 2;
                attribute A.D e = A.D::Q;
                @opposite A.C::x
                reference A.C x;
            }
            class C implements SuperInt{
                @opposite A.B::x
                reference A.B[*] x; 
            }
            abstract class SuperAbst {
                attribute bool abst = true;
            }
            interface SuperInt {
                attribute bool interf = true;
            }
            enum D {
                Q = true,
                W = false
            }
        }    
        macro test[A.B x]{
            x {
                a = false
                c = "XYZ"
                d = 42
                e = A.D::W
                x -> y 
                abst = false
            }
            A.C y {
                interf = false
            }
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });
});
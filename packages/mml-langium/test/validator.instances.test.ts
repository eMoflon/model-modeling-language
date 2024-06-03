import {describe, expect, test} from "vitest";
import {expectErrorCode, getValidation} from "./testutils.js";
import {IssueCodes} from "../src/language/model-modeling-language-validator.js";

describe('Instance validator tests', () => {
    test('Validator should notice non-unique function name', async () => {
        const validationResult = await getValidation(`
        instance A {
        }
        instance A {
        }
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.InstanceNameNotUnique);
    });

    test('Validator should notice non-matching for loop type', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                @opposite A.E::x
                reference A.E[*] y;
            }
            class C {
            }
            class E {
                @opposite A.B::y
                reference A.B[1] x; 
            }
        }    
        macro T1[] {
            A.B x {
            }
            A.C y {
            }
        }
        
        macro T2[A.C x] {
            x {
            }
        }

        instance A {
            A.B a = T1[].x
            for a-y->p {
                T2[p]
            }
        }       
        `);

        expect(validationResult.diagnostics.length).toEqual(1);
        expectErrorCode(validationResult, 0).toEqual(IssueCodes.FunctionMacroCallArgumentTypeMismatch);
    });

    test('Validator should succeed', async () => {
        const validationResult = await getValidation(`
        package A {
            class B {
                @opposite A.E::x
                reference A.E[*] y;
            }
            class C {
            }
            class E {
                @opposite A.B::y
                reference A.B[1] x; 
            }
        }    
        macro T1[] {
            A.B x {
            }
            A.C y {
            }
        }
        
        macro T2[A.E x] {
            x {
            }
        }
        
        function F1() returns A.B {
            A.B x = T1[].x
            return x
        }
        
        instance A {
            A.B a = T1[].x
            F1()
            for a-y->p {
                T2[p]
            }
        }       
        `);

        expect(validationResult.diagnostics.length).toEqual(0);
    });
});
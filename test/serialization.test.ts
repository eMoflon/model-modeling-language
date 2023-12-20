import {describe, test} from "vitest";
import {getSerialization} from "./testutils.js";

describe('Serializer tests', () => {
    test('test', async () => {
        const serialization = await getSerialization(`
        package A {
            class B {
                attribute int x;
                reference A.C z;
            }
            
            class C {
            }
        }
        
        macro T1[] {
            A.C works {
            }
            A.B test{
                x = 5
                z -> works
            }
        }
        
        macro T2[A.B x,A.C y] {
            x {
                x = 42
                z -> y
            }
        }
        
        macro T3[]{
            A.C reffing {
            }
        }
        
        instance gen {
            tuple x = T1[]
            A.C newref = T3[].reffing
            T2[x.test,newref]
        }
        `);

        console.warn(serialization);
    });

    test('test with loop', async () => {
        const serialization = await getSerialization(`
        package A {
            class B {
                attribute int x;
                reference A.C z;
            }
            
            class C {
                attribute int x = 0;
            }
        }
        
        macro T1[] {
            A.C w1 {
            }
            A.C w2 {
            }
            A.C w3 {
            }
            A.B test{
                x = 5
                z -> w1
                z -> w2
                z -> w3
            }
        }
        
        macro T2[A.C x]{
            x {
                x = 42
            }
        }
        
        instance gen {
            A.B test = T1[].test
            for test-z->child {
                T2[child]
            }
        }
        `);

        console.warn(serialization);
    });
});
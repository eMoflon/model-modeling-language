import {describe, expect, test} from "vitest";
import {getModel} from "./testutils";


describe('Test model definition parser', () => {
    test('Test import', async () => {
        const model = await getModel(`
        import "path/to/other/file";
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test import with alias', async () => {
        const model = await getModel(`
        import "path/to/other/file" using Test.Model as Test;
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test single line comment', async () => {
        const model = await getModel(`
        /// Test comment
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test multiline comment', async () => {
        const model = await getModel(`
        /* Test comment */
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test package', async () => {
        const model = await getModel(`
        package Test {
        
        }
        `);
        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test package with subpackages', async () => {
        const model = await getModel(`
        package Test {
            package SubTest1 {
            }
            
            package SubTest2 {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test interface', async () => {
        const model = await getModel(`
        package Test {
            interface TInterface {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test interface that extends interface', async () => {
        const model = await getModel(`
        package Test {
            interface TSuperInterface {
            }
            interface TInterface extends TSuperInterface {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test interface that extends multiple interfaces', async () => {
        const model = await getModel(`
        package Test {
            interface TSuperInterface {
            }
            interface TSuperInterface2 {
            }
            interface TInterface extends TSuperInterface, TSuperInterface2 {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test enum', async () => {
        const model = await getModel(`
        package Test {
            enum TEnum {
                A,
                B
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test enum with default values', async () => {
        const model = await getModel(`
        package Test {
            enum TEnum {
                A = 1,
                B = 2
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test abstract class', async () => {
        const model = await getModel(`
        package Test {
            abstract class TAbstractClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class that implements interface', async () => {
        const model = await getModel(`
        package Test {
            class TClass implements TInterface {
            }
            interface TInterface {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class that extends class', async () => {
        const model = await getModel(`
        package Test {
            class TSuperClass {
            }
            class TClass extends TSuperClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class that extends abstract class', async () => {
        const model = await getModel(`
        package Test {
            abstract class TAbstractClass {
            }
            class TClass extends TAbstractClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test abstract class that extends class', async () => {
        const model = await getModel(`
        package Test {
            abstract class TAbstractClass extends TSuperClass {
            }
            class TSuperClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test abstract class that extends abstract class', async () => {
        const model = await getModel(`
        package Test {
            abstract class TAbstractClass extends TSuperClass {
            }
            abstract class TSuperClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with string attribute', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute string x;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with string attribute and value', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute string x = "Test";
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with int attribute', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute int x;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with int attribute and value', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute int x = 42;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with double attribute', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute double x;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with double attribute and value', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute double x = 4.2;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with float attribute', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute float x;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with float attribute and value', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute float x = 4.2;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with bool attribute', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute bool x;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with bool attribute and value', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute bool x = true;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with enum attribute', async () => {
        const model = await getModel(`
        package Test {
            enum TEnum {
                A,
                B
            }
        
            class TClass {
                attribute Test.TEnum x;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with enum attribute and value', async () => {
        const model = await getModel(`
        package Test {
            enum TEnum {
                A,
                B
            }
        
            class TClass {
                attribute Test.TEnum x = Test.TEnum::A;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with attribute and single modifier', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute int x = 42 {unique};
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with attribute and multiple modifiers', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute int x {unique ordered};
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with attribute and value with single modifier', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute int x = 42 {unique};
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with attribute and value with multiple modifiers', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                attribute int x = 42 {unique ordered};
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with reference', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                reference Test.TRefClass x;
            }
            
            class TRefClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with reference and multiplicity', async () => {
        const model = await getModel(`
        package Test {
        class TClass {
                reference Test.TRefClass[*] x;
            }
            
            class TRefClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with reference and multiplicity 2', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                reference Test.TRefClass[+] x;
            }
            
            class TRefClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with reference and multiplicity 3', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                reference Test.TRefClass[1] x;
            }
            
            class TRefClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with reference and multiplicity 4', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                reference Test.TRefClass[0..5] x;
            }
            
            class TRefClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with reference and multiplicity 5', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                reference Test.TRefClass[0..*] x;
            }
            
            class TRefClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with reference and multiplicity 6', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                reference Test.TRefClass[0..+] x;
            }
            
            class TRefClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with reference and modifier', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                reference Test.TRefClass x {ordered};
            }
            
            class TRefClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with reference, multiplicity and modifier', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                reference Test.TRefClass[1..5] x {ordered};
            }
            
            class TRefClass {
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with annotated reference', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                @opposite Test.TRefClass::y
                reference Test.TRefClass x;
            }
            
            class TRefClass {
                reference Test.TClass y;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });

    test('Test class with bi-annotated reference', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                @opposite Test.TRefClass::y
                reference Test.TRefClass x;
            }
            
            class TRefClass {
                @opposite Test.TClass::x
                reference Test.TClass y;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with annotated reference and multiplicity', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                @opposite Test.TRefClass::y
                reference Test.TRefClass[1] x;
            }
            
            class TRefClass {
                reference Test.TClass y;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with annotated reference and modifier', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                @opposite Test.TRefClass::y
                reference Test.TRefClass x {ordered};
            }
            
            class TRefClass {
                reference Test.TClass y;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    test('Test class with annotated reference, multiplicity and modifier', async () => {
        const model = await getModel(`
        package Test {
            class TClass {
                @opposite Test.TRefClass::y
                reference Test.TRefClass[*] x {ordered};
            }
            
            class TRefClass {
                reference Test.TClass y;
            }
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });


    /*test('Test ', async () => {
        const model = await getModel(`
        package Test {
        
        }
        `);

        expect(model.$document.parseResult.parserErrors.length).toEqual(0);
    });*/
});
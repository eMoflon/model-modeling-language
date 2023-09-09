import {describe, expect, test} from "vitest";
import {getArithExprEval} from "./testutils";

describe('Arith Expression evaluator', () => {
    test('Addition 1', async () => {
        const evalRes = await getArithExprEval("1 + 1")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(2)
    })

    test('Addition 2', async () => {
        const evalRes = await getArithExprEval("1 + -1")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(0)
    })

    test('Addition 3', async () => {
        const evalRes = await getArithExprEval("1 + (-1)")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(0)
    })

    test('Addition 4', async () => {
        const evalRes = await getArithExprEval('1 + "Test"')
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual("1Test")
    })

    test('Subtraction 1', async () => {
        const evalRes = await getArithExprEval("1 - 1")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(0)
    })

    test('Subtraction 2', async () => {
        const evalRes = await getArithExprEval("1 - -1")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(2)
    })

    test('Subtraction 3', async () => {
        const evalRes = await getArithExprEval("1 - (-1)")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(2)
    })

    test('Multiplication 1', async () => {
        const evalRes = await getArithExprEval("2 * 3")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(6)
    })

    test('Multiplication 2', async () => {
        const evalRes = await getArithExprEval("-2 * 3")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(-6)
    })

    test('Multiplication 3', async () => {
        const evalRes = await getArithExprEval("2 * (-3)")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(-6)
    })

    test('Multiplication 4', async () => {
        const evalRes = await getArithExprEval('2 * "Test"')
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual("TestTest")
    })

    test('Division 1', async () => {
        const evalRes = await getArithExprEval("4 / 2")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(2)
    })

    test('Division 2', async () => {
        const evalRes = await getArithExprEval("4 / -2")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(-2)
    })

    test('Power 1', async () => {
        const evalRes = await getArithExprEval("2 ^ 4")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(16)
    })

    test('Power 2', async () => {
        const evalRes = await getArithExprEval("2 ^ -4")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(0.0625)
    })

    test('Power 3', async () => {
        const evalRes = await getArithExprEval("2 ^ (-4)")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(0.0625)
    })

    test('Modulo 1', async () => {
        const evalRes = await getArithExprEval("17 % 2")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(1)
    })

    test('Modulo 2', async () => {
        const evalRes = await getArithExprEval("-24 % 3")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(-0)
    })

    test('Advanced 1', async () => {
        const evalRes = await getArithExprEval("25 + 43 * 234 ^ 3 / 2")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(275477461)
    })

    test('Advanced 2', async () => {
        const evalRes = await getArithExprEval("25 + (43 * 234)^ 3 / 2")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(509357779189)
    })

    test('Advanced 3', async () => {
        const evalRes = await getArithExprEval("25 + (2 * 2) ^ (3 / 2)")
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(33)
    })

    test('Advanced 4', async () => {
        const evalRes = await getArithExprEval('"A" * (3 + 4)')
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual("AAAAAAA")
    })

    test('Advanced 5', async () => {
        const evalRes = await getArithExprEval('"A" * (3 + 4) + "Test"')
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual("AAAAAAATest")
    })

    test('Advanced 6', async () => {
        const evalRes = await getArithExprEval('"B" + ("A" * (3 + 4)) + "B"')
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual("BAAAAAAAB")
    })

    test('Advanced 7', async () => {
        const evalRes = await getArithExprEval('"Enum test: "+ExprEval.TestEnum::EnumA')
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual("Enum test: EnumA")
    })

    test('Advanced 8', async () => {
        const evalRes = await getArithExprEval('2 * ExprEval.TestEnum::EnumA')
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual("EnumAEnumA")
    })

    test('Advanced 9', async () => {
        const evalRes = await getArithExprEval('ExprEval.TestIntEnum::EnumA')
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(42)
    })

    test('Advanced 10', async () => {
        const evalRes = await getArithExprEval('1 + ExprEval.TestIntEnum::EnumA')
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual(43)
    })

    test('Advanced 11', async () => {
        const evalRes = await getArithExprEval('ExprEval.TestStringEnum::EnumA')
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual("Test?")
    })

    test('Advanced 12', async () => {
        const evalRes = await getArithExprEval('2 * ExprEval.TestStringEnum::EnumA')
        console.log(evalRes)
        expect(evalRes).not.toBeUndefined()
        expect(evalRes).toEqual("Test?Test?")
    })
})
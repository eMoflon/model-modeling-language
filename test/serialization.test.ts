import {describe, test} from "vitest";
import {getSerialization} from "./testutils";

describe('ArithExpr validator tests', () => {
    test('test', async () => {
        const serialization = await getSerialization(`
        package A {
            enum T {
                A = 1,
                B = 2,
                C = 3
            }
        }
        `);

        console.warn(serialization);
    });
});
import {describe, test} from "vitest";
import {assertDeserializer, getSerialization} from "./testutils.js";

describe('Deserializer tests', () => {
    test('Simple package', async () => {
        const code: string = `
package A {
}
`;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('Simple package with subpackage', async () => {
        const code: string = `
package A {
    package B {
    }
}
`;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('Simple package with enum', async () => {
        const code: string = `
package A {
    enum B {
        X,
        Y = 42
    }
}
`;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('Simple package with enum and class', async () => {
        const code: string = `
package A {
    enum B {
        X,
        Y = 42
    }
    class C {
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('Simple package with class 1', async () => {
        const code: string = `
package A {
    class B {
        attribute int x;
        attribute int y = 5;
        attribute string z = "abc" {readonly};
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('Simple package with class 2', async () => {
        const code: string = `
package A {
    class B {
        @opposite A.C::y
        reference A.C[1] x;
    }
    class C {
        @opposite A.B::x
        reference A.B[1] y;
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('Advanced code 1', async () => {
        const code: string = `
package A {
    enum C {
        Q = true,
        W = false
    }
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
    class D {
        @opposite A.B::x
        reference A.B[+] x;
    }
    class E {
        @opposite A.B::y
        reference A.B[1..5] x;
    }
}
        `;
        const serialization = await getSerialization(code);
        assertDeserializer(serialization, code);
    });

    test('References with multiplicity 1', async () => {
        const code: string = `
package A {
    class B {
        reference A.C x;
    }
    class C {
        reference A.B y;
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('References with multiplicity 2', async () => {
        const code: string = `
package A {
    class B {
        reference A.C[1] x;
    }
    class C {
        reference A.B y;
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('References with multiplicity 3', async () => {
        const code: string = `
package A {
    class B {
        reference A.C[5] x;
    }
    class C {
        reference A.B y;
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('References with multiplicity 4', async () => {
        const code: string = `
package A {
    class B {
        reference A.C[+] x;
    }
    class C {
        reference A.B y;
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('References with multiplicity 5', async () => {
        const code: string = `
package A {
    class B {
        reference A.C[*] x;
    }
    class C {
        reference A.B y;
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('References with multiplicity 6', async () => {
        const code: string = `
package A {
    class B {
        reference A.C[0..+] x;
    }
    class C {
        reference A.B y;
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('References with multiplicity 7', async () => {
        const code: string = `
package A {
    class B {
        reference A.C[0..5] x;
    }
    class C {
        reference A.B y;
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('References with multiplicity 8', async () => {
        const code: string = `
package A {
    class B {
        reference A.C[1..5] x;
    }
    class C {
        reference A.B y;
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('References with multiplicity 9', async () => {
        const code: string = `
package A {
    class B {
        reference A.C[2..5] x;
    }
    class C {
        reference A.B y;
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });

    test('References with multiplicity 10', async () => {
        const code: string = `
package A {
    class B {
        reference A.C[0..*] x;
    }
    class C {
        reference A.B y;
    }
}
        `;
        const serialization = await getSerialization(code);

        assertDeserializer(serialization, code);
    });
})

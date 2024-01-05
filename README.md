# Model Modeling Language

The Model modeling language (MML) is a domain-specific modeling language implemented with the open-source
language engineering tool [Langium](https://langium.org/).
MML has been thoroughly designed to provide structures for automatic generation of individual instances
in addition to the specification of the basic metamodels.

With the help of Langium, four different products are provided:

* A **command line interface** (CLI) to convert MML files to a unified JSON format
* A **VSCode extension** (VSIX) for direct use in e.g. VSCode, Visual Studio or Eclipse Theia
* A **Language Server** based on the Language Server Protocol (LSP)
* An **extended Language Server**, based on the Language Server Protocol (LSP), to provide continuous output

---

* [How to build](#how-to-build)
* [Using the CLI](#using-the-cli)
* [Using the Language Server](#using-the-language-server)
* [Using the VSCode Extension](#using-the-vscode-extension)
* [The Model Modeling Language](#the-model-modeling-language)
  * [Specification of Metamodels](#on-the-specification-of-metamodels)
  * [Specification of Instances](#on-the-specification-of-instances)
* [Translating from Ecore to MML](#translating-from-ecore-to-mml)
* [File structure](#file-structure-where-can-i-find)

---

## How to build

Langium requires Node.js >=14 and npm >=7. Once you have those requirements installed, you can install the required node
dependencies:

```shell
npm install
```

After modifying the MML grammar (`model-modeling-language.langium`), the Langium generator must be executed
first. The following command can be used for this purpose:

```shell
npm run fullbuild
```

The language server and the CLI as well as the VSCode extension will be built.

## Using the CLI

The Command Line Interface (CLI) is a simple tool to evaluate one or more MML files and convert them into the
unified JSON format. However, this requires that all MML files can compile without errors. Otherwise, the still existing
errors are output by the CLI. The CLI can be executed with the following command, whereas target either a path
to a single file or to a folder can be specified. In the latter case all containing MML files are included.

```shell
./bin/cli <TARGET> generate
```

## Using the Language Server

The language server can be started using Node.js. Since it is based on the Language
Server protocol, it can be integrated into a variety of
applications (e.g. Atom, Emacs, Eclipse, Monaco Editor, neovim,
VS, [etc.](https://microsoft.github.io/language-server-protocol/implementors/tools/)). To do this, execute
the following command:

```shell
node ./out/language-server/main.js --stdio
```

## Using the VSCode Extension
Open the Extensions tab and click on the three dots to open the context menu.
Select "Install from VSIX..." and select the generated MML-VSIX file. Now the MML plugin will be
installed and used automatically for _.mml_ files.

To achieve the full range of functions, the [Model Modeling Language CLI](https://github.com/eMoflon/model-modeling-language-cli) must also be provided. 
This enables interaction with EMF and thus the generation of Ecore/XMI files directly from VSCode.

## The Model Modeling Language

The Model Modeling Language includes two different goals, which consist of metamodel specification on the one hand and
instantiation of these models on the other hand. For this reason, we will consider the associated structures
separately in the following.

### On the specification of metamodels

A model basically consists of a package. However, a package can consist of any number of subpackages.
Each package is defined by the keyword `package` and a unique name.

```text
package <Name> {
    package <Name> {
    
    }
}
```

Within a package any number of abstract classes, classes, interfaces and enums can be defined.
Enums define variables that represent a constant value of a uniform data type by symbols.
In MML we assume that all enum variables have a uniform data type. Alternatively, a value can be left undefined.
The data type of an enum is not explicitly specified, but dynamically inferred based on the defined values.

```text
enum <Name> {
    <Literal> [= <Value>]
}
```

Abstract classes, classes and interfaces differ only marginally. Abstract classes cannot be instantiated, but can
be extended by other (abstract) classes using the extends keyword. Interfaces can be implemented by abstract classes
as well as by classes, or extend other interfaces. We do not limit the number of inheritances to one at this point,
since the implementation in the connected modeling tools may differ. The
well-known ["diamond problem"](https://en.wikipedia.org/wiki/Multiple_inheritance) should
however be considered.

```text
abstract class <Name> [extends <ClassName>, <ClassName>] [implements <InterfaceName>, <InterfaceName>] {

}

class <Name> [extends <ClassName>, <ClassName>] [implements <InterfaceName>, <InterfaceName>] {

}

interface <Name> [extends <InterfaceName>, <InterfaceName>] {

}
```

Regarding their body, the three structures do not differ. We provide two types of statements: Attributes and References.
Attributes define a typed variable that can store any value. Already at this point a default value can be specified.
An attribute can have as its type either a primitive data type (`int`, `string`, `bool`, `double`, `float`) or an enum
value.

```text
attribute <Type> <Name>;
attribute <Type> <Name> = <Value>;
attribute <Type> <Name> {<Modifier> <Modifier>};
```

References are pointers to other classes or to themselves, which can be set at instantiation. They consist of the
type of their target, optionally a multiplicity and a name. In addition, an opposite annotation can be set, by
which a two-sided reference between two objects can be ensured.

```text
reference <Type> <Name>;
reference <Type> <Name> {<Modifier> <Modifier>};
reference <Type>[1] <Name>;
reference <Type>[+] <Name>;
reference <Type>[*] <Name>;
reference <Type>[1..*] <Name>;

@opposite <Type>::<ReferenceName>
reference <Type>[1..*] <Name>;
```

Attributes and references can additionally be provided with a number of modifiers. These are appended as a simple
enumeration in curly brackets (separated by spaces). Note that the meaning of a modifier can be negated by 
prefixing it with a `!` operator. Modifiers that reflect the default value (see table) do not have to be set explicitly. 
Therefore, a negation should usually only be necessary for the modifiers `unique`, `ordered` and `resolve`.

| Keyword    | Description | Applicability        | Default |
|------------|-------------|----------------------|---------|
| readonly   |             | Attribute, Reference | false   |
| volatile   |             | Attribute, Reference | false   |
| transient  |             | Attribute, Reference | false   |
| unsettable |             | Attribute, Reference | false   |
| derived    |             | Attribute, Reference | false   |
| unique     |             | Attribute, Reference | true    |
| ordered    |             | Attribute, Reference | true    |
| id         |             | Attribute            | true    |
| resolve    |             | Reference            | false   |

### On the specification of instances

Instances can be generated with MML based on a specified metamodel. For this purpose, we provide the control
structures Instances, Macros and Functions.
We use macros to instantiate individual classes of the metamodel. In addition, already existing instances can
be passed as parameters and modified. When instantiating, the instances first receive default values that may have
been set in the metamodel. In addition, attributes and references can be set/changed.

```text
macro <Name>[] {
    <ClassName> <Name> {
        <AttributeName> = <Value>
        <ReferenceName> -> <ClassInstance>
    }
}
```

While macros do not allow complex nesting, functions do. Functions can call other functions as well as macros.
We also introduce a loop control structure that can iterate over an integer interval.
Finally, we introduce typed variables that can store the return values provided by functions and macros.
Here, macros and functions behave differently. Macro calls basically return a tuple of all defined instances. These can
either be assigned to a variable of type tuple, or restricted to a specific element by a selector. Functions do not
have a return value by default. However, this can be changed by defining the return type in the function signature and
a return statement at the end of the function.

```text
function <Name> () {
    <MacroName>[]
    <FunctionName>()
    tuple <VariableName> = <MacroName>[]
    <ClassName> <VariableName> = <MacroName>[].<InstanceName> 
    <Type> <VariableName> = <FunctionName>()
    
    for i in <Lower>:<Upper> {
        
    }
}

function <Name> () returns <Type> {
    return <VariableOrValue>
}
```

Each instance block represents a model instance in the generated output. Like functions, instance blocks can also
contain macro and function calls as well as introduce variables. We also provide a special loop structure that can
iterate over a multivalued reference of a class instance.

```text
instance <Name> {
    <MacroName>[]
    <FunctionName>()
    tuple <VariableName> = <MacroName>[]
    <ClassName> <VariableName> = <MacroName>[].<InstanceName> 
    <Type> <VariableName> = <FunctionName>()
    
    for <InstanceVariableName> -<ReferenceName>-> <VariableName> {
    
    }
}
```

## Translating from Ecore to MML
The VSCode plugin supports the automatic translation of Ecore files into MML. To do this, right-click on an `.ecore` file 
and select `Translate Ecore Model to MML`. If successful, the translated `.mml` file will be saved in the `generated` folder.

**Note:** Currently there is no support for metamodels that import additional metamodels.

## File structure: Where can I find....

| Filepath                                                           | Description                                                                                   |
|--------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| `/src/cli/*`                                                       | CLI functionality: parameter handling and calling of the MML interpreter                      |
| `/src/language/generated/*`                                        | Generated parser: Do **not** modify these files, because they will be overwritten by Langium! |
| `/src/language/serializer/mml-entity-templates.ts`                 | Dataclasses for the serialization of metamodel elements                                       |
| `/src/language/serializer/mml-instance-templates.ts`               | Dataclasses for the serialization of instances                                                |
| `/src/language/serializer/mml-instance-registry.ts`                | Registration for previously created instances                                                 |
| `/src/language/serializer/mml-reference-storage.ts`                | Registration for previously created metamodel elements                                        |
| `/src/language/serializer/mml-serializer.ts`                       | Base serialization of MML models                                                              |
| `/src/language/serializer/mml-serializer-context.ts`               | Context for resolving environment variables                                                   |
| `/src/language/serializer/utils.ts`                                | Utility functions                                                                             |
| `/src/language/main.ts`                                            | Language Server startup file                                                                  |
| `/src/language/model-modeling-language.langium`                    | **The** Model Modeling Language grammar definition                                            |
| `/src/language/model-modeling-language-code-action-provider.ts`    | Implementation of QuickFixes                                                                  |
| `/src/language/model-modeling-language-completion-provider.ts`     | Implementation of Code Snippets                                                               |
| `/src/language/model-modeling-language-formatter.ts`               | Implementation of automatic code formatting                                                   |
| `/src/language/model-modeling-language-module.ts`                  | Base registration of langium services                                                         |
| `/src/language/model-modeling-language-scope-computation.ts`       | Definition of global scope exports                                                            |
| `/src/language/model-modeling-language-scope-provider.ts`          | Definition of custom scopes for language structures                                           |
| `/src/language/model-modeling-language-semantic-token-provider.ts` | Implementation of semantic highlighting                                                       |
| `/src/language/model-modeling-language-utils.ts`                   | Collection of utility functions                                                               |
| `/src/language/model-modeling-language-validator.ts`               | Implementation of code validation checks                                                      |
| `/src/extension/main.ts`                                           | Entrypoint for the VSIX extension                                                             |
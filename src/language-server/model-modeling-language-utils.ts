import {AstNode} from "langium";
import {isClass, isInterface, isPackage} from "./generated/ast";

export class ModelModelingLanguageUtils {
    public static getQualifiedRefName(node: AstNode, name: string): string {
        let parent: AstNode | undefined = node.$container;
        if (isClass(parent)) {
            name = `${parent.name}::${name}`;
            parent = parent.$container;
        }
        while (isPackage(parent)) {
            // Iteratively prepend the name of the parent namespace
            // This allows us to work with nested namespaces
            name = `${parent.name}.${name}`;
            parent = parent.$container;
        }
        return name;
    }

    public static getQualifiedClassName(node: AstNode, name: string): string {
        let parent: AstNode | undefined = node.$container;
        while (isPackage(parent)) {
            // Iteratively prepend the name of the parent namespace
            // This allows us to work with nested namespaces
            name = `${parent.name}.${name}`;
            parent = parent.$container;
        }
        return name;
    }

    public static getIndentationLevel(node: AstNode): number {
        let parent: AstNode | undefined = node.$container;
        let level = 0;
        while (isPackage(parent) || isClass(parent) || isInterface(parent)) {
            level += 1;
            parent = parent.$container;
        }
        return level;
    }
}
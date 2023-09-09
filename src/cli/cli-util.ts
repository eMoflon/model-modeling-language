import chalk from 'chalk';
import path, {resolve} from 'path';
import fs from 'fs';
import {AstNode, LangiumDocument, LangiumServices} from 'langium';
import {URI} from 'vscode-uri';

export enum GeneratorTargetType {
    FILE,
    DIRECTORY,
    UNKNOWN
}

export function getTargetType(targetName: string): GeneratorTargetType {
    if (!fs.existsSync(targetName)) {
        console.error(chalk.red(`Target ${targetName} does not exist.`));
        return GeneratorTargetType.UNKNOWN
    }
    if (fs.lstatSync(targetName).isDirectory()) {
        return GeneratorTargetType.DIRECTORY
    }
    return GeneratorTargetType.FILE
}

export function getFilesInDirRecursive(targetName: string, extensions: string[]): string[] {
    const fileNames: string[] = []
    fs.readdirSync(targetName).forEach(filePath => {
        const fullPath = path.join(targetName, filePath)
        if (fs.lstatSync(fullPath).isDirectory()) {
            fileNames.push(...getFilesInDirRecursive(fullPath, extensions))
        }
        if (extensions.includes(path.extname(fullPath))) {
            fileNames.push(fullPath)
        }
    });
    return fileNames
}

export async function getFiles(dir: string): Promise<string[]> {
    const dirents = await fs.promises.readdir(dir, {withFileTypes: true});
    const files = await Promise.all(dirents.map((dirent) => {
        const res = resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files) as string[];
}

export async function extractDocuments(fileNames: string[], services: LangiumServices): Promise<LangiumDocument[]> {
    const extensions = services.LanguageMetaData.fileExtensions;

    const documents: LangiumDocument[] = []
    for (const fileName of fileNames) {
        if (!extensions.includes(path.extname(fileName))) {
            console.error(chalk.yellow(`Please choose a file with one of these extensions: ${extensions}.`));
            process.exit(1);
        }

        if (!fs.existsSync(fileName)) {
            console.error(chalk.red(`File ${fileName} does not exist.`));
            process.exit(1);
        }

        const document = services.shared.workspace.LangiumDocuments.getOrCreateDocument(URI.file(path.resolve(fileName)));
        documents.push(document)
    }

    await services.shared.workspace.DocumentBuilder.build(documents, {validationChecks: 'all'});

    let containsError = false;
    for (const document of documents) {
        const validationErrors = (document.diagnostics ?? []).filter(e => e.severity === 1);
        if (validationErrors.length > 0) {
            console.error(chalk.red(`There are validation errors in document ${document.uri.toString()}:`));
            for (const validationError of validationErrors) {
                console.error(chalk.red(
                    `line ${validationError.range.start.line + 1}: ${validationError.message} [${document.textDocument.getText(validationError.range)}]`
                ));
            }
        }
    }
    if (containsError) {
        process.exit(1);
    }

    return documents;
}

export async function extractAstNode<T extends AstNode>(fileName: string, services: LangiumServices): Promise<T> {
    // @ts-ignore
    return (await extractDocuments([fileName], services)).at(0).parseResult.value as T
}

export async function extractAstNodes<T extends AstNode>(fileNames: string[], services: LangiumServices): Promise<T[]> {
    return (await extractDocuments(fileNames, services)).map(doc => doc.parseResult.value as T)
}

interface FilePathData {
    destination: string,
    name: string
}

export function extractDestinationAndName(filePath: string, destination: string | undefined): FilePathData {
    filePath = path.basename(filePath, path.extname(filePath)).replace(/[.-]/g, '');
    return {
        destination: destination ?? path.join(path.dirname(filePath), 'generated'),
        name: path.basename(filePath)
    };
}

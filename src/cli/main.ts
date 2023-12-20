import type { Model } from '../language/generated/ast.js';
import chalk from 'chalk';
import { Command } from 'commander';
import { ModelModelingLanguageLanguageMetaData } from '../language/generated/module.js';
import { createModelModelingLanguageServices } from '../language/model-modeling-language-module.js';
import {extractAstNode, extractAstNodes, GeneratorTargetType, getFiles, getTargetType} from './cli-util.js';
import { NodeFileSystem } from 'langium/node';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {generateMultiModelSerialization, generateSingleModelSerialization} from "./generator.js";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (targetName: string, opts: GenerateOptions): Promise<void> => {
    const services = createModelModelingLanguageServices(NodeFileSystem).MmlServices;
    const targetType: GeneratorTargetType = getTargetType(targetName)
    let generatedFilePath = ""
    if (targetType == GeneratorTargetType.FILE) {
        const model = await extractAstNode<Model>(targetName, services);
        generatedFilePath = generateSingleModelSerialization(model, targetName, opts.destination, services);
    } else if (targetType == GeneratorTargetType.DIRECTORY) {
        const filePaths: string[] = await getFiles(targetName)
        const filteredFilePaths: string[] = filePaths.filter(p => services.LanguageMetaData.fileExtensions.includes(path.extname(p)))
        const models: Model[] = await extractAstNodes(filteredFilePaths, services)
        generatedFilePath = generateMultiModelSerialization(models, targetName, opts.destination, services);
    } else {
        console.error(chalk.red(`The specified target path is invalid: ${targetName}.`));
        process.exit(1);
    }
    console.log(chalk.green(`Model serialization generated successfully: ${generatedFilePath}`));
};

export type GenerateOptions = {
    destination?: string;
}

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = ModelModelingLanguageLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates model serializations for the supplied mml file(s)')
        .action(generateAction);

    program.parse(process.argv);
}

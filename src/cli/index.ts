import chalk from 'chalk';
import {Command} from 'commander';
import {Model} from '../language-server/generated/ast';
import {ModelModelingLanguageLanguageMetaData} from '../language-server/generated/module';
import {createModelModelingLanguageServices} from '../language-server/model-modeling-language-module';
import {extractAstNode, extractAstNodes, GeneratorTargetType, getFiles, getTargetType} from './cli-util';
import {generateMultiModelSerialization, generateSingleModelSerialization} from './generator';
import {NodeFileSystem} from 'langium/node';
import path from "path";

export const generateAction = async (targetName: string, opts: GenerateOptions): Promise<void> => {
    const services = createModelModelingLanguageServices(NodeFileSystem).mmlServices;
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

export default function (): void {
    const program = new Command();

    program
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .version(require('../../package.json').version);

    const fileExtensions = ModelModelingLanguageLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates model serializations for the supplied mml file(s)')
        .action(generateAction);

    program.parse(process.argv);
}

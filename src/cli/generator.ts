import fs from 'fs';
import {CompositeGeneratorNode, NL, toString} from 'langium';
import path from 'path';
import {Model} from '../language-server/generated/ast';
import {extractDestinationAndName} from './cli-util';
import {serializeModel} from "../language-server/generator/mml-serializer";
import {ModelModelingLanguageServices} from "../language-server/model-modeling-language-module";

export function generateSingleModelSerialization(model: Model, filePath: string, destination: string | undefined, services: ModelModelingLanguageServices): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.json`;

    const fileNode = new CompositeGeneratorNode();
    const serializedData = serializeModel(model, services)
    fileNode.append(serializedData);

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, {recursive: true});
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

export function generateMultiModelSerialization(models: Model[], filePath: string, destination: string | undefined, services: ModelModelingLanguageServices): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.json`;

    const fileNode = new CompositeGeneratorNode();
    fileNode.append('[', NL)
    for (let i = 0; i < models.length; i++) {
        const model: Model = models[i]
        const serializedData = serializeModel(model, services)
        fileNode.append(serializedData);
        if (i + 1 != models.length) {
            fileNode.append(',')
        }
        fileNode.append(NL)
    }
    fileNode.append(']')

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, {recursive: true});
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

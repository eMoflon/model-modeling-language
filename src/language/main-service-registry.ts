import {DefaultServiceRegistry, LangiumServices, URI, UriUtils} from "langium";

export class MainServiceRegistry extends DefaultServiceRegistry {
    override getServices(uri: URI): LangiumServices {
        if (this.singleton !== undefined) {
            return this.singleton;
        }
        if (this.map === undefined) {
            throw new Error('The service registry is empty. Use `register` to register the services of a language.');
        }
        let ext = UriUtils.extname(uri);

        if (ext == ".gmnb") {
            ext = ".gm";
        }

        const services = this.map[ext];
        if (!services) {
            throw new Error(`The service registry contains no services for the extension '${ext}'.`);
        }
        return services;
    }
}
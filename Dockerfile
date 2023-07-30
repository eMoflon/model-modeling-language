FROM node:20-alpine
WORKDIR /mml

RUN npm i -g yo generator-langium
RUN npm i --save-dev esbuild
RUN npm install -g @vscode/vsce

COPY --chown=node . .
RUN npm install

VOLUME /mml/out

RUN chown -R node:node /mml/out

USER node

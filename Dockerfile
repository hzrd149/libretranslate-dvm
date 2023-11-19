FROM node:20-alpine

WORKDIR /app
COPY . /app/

RUN yarn install
RUN yarn build

ENTRYPOINT [ "node", "build/index.js" ]

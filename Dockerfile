FROM node:22-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm

WORKDIR /app
COPY . /app/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
RUN pnpm build

ENTRYPOINT [ "node", "build/index.js" ]

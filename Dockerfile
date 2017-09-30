FROM node:8-alpine

EXPOSE 3000

RUN mkdir -p /app
WORKDIR /app

VOLUME /app/logs

COPY package.json /app
RUN npm install --silent --production

COPY web /app/web
COPY VERSION /app/VERSION

CMD node web/index.js

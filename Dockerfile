FROM node:14-alpine

WORKDIR /home/node/

COPY ./package*.json /home/node/
RUN npm ci

COPY ./src /home/node/src/
COPY .babelrc tsconfig.json webpack*.ts /home/node/

#RUN npm run downloadCertBundle
#RUN npm run downloadFlags
RUN npm run build

CMD node /home/node/src/server/index.js


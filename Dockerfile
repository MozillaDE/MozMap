FROM node:6-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

VOLUME /usr/src/app/data

EXPOSE 3000 3443
CMD [ "npm", "start" ]

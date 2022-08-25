FROM node:14-alpine

USER root
WORKDIR /vebank
COPY package*.json ./
RUN npm install && \
    npm install -g pm2
COPY . /vebank

ENV NODE_ENV production

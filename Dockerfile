FROM node:current
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY --chown=node:node . .
USER node
RUN npm run build
EXPOSE 8080
CMD [ "npm", "run", "start" ]
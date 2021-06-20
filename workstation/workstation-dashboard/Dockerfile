FROM node:10.11.0
COPY package.json package.json
WORKDIR /usr/src/workstation-dashboard-nodejs
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3015
CMD [ "node", "server.js" ]

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set registry http://registry.npmjs.org/
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"] 
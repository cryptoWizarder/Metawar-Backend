FROM node:lts

# Create app directory
WORKDIR /usr/src/app

COPY package.json /usr/src/app/package.json
COPY package-lock.json /usr/src/app/package-lock.json
RUN npm i
COPY . /usr/src/app
RUN npm run build

RUN find . ! -regex '\./package.*\|\./prisma.*\|\./dist.*\|\./node_modules.*' -delete

EXPOSE 3000

CMD [ "npm", "start"]

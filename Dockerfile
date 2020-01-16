FROM node:10

# Create app directory
WORKDIR /app

# install gulp
RUN npm install --global gulp-cli

# Install app dependencies
COPY package.json        /app/package.json
COPY npm-shrinkwrap.json /app/npm-shrinkwrap.json
RUN npm install

# copy app source to image
COPY . /app

# build static files (for pipelines to grab)
RUN gulp build-clean

# set default command
CMD gulp

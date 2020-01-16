# Front-End Baseline

A simple starting point project for front-end development.  It is platform agnostic and includes Bootstrap 4.  It compiles scss and js into production-ready files.

[**Live demo**](https://patternlab.aws.reingoldms.com/) - [**login info**](https://reingold-tech.atlassian.net/wiki/spaces/TechDocs/pages/528777246/PatternLab)

[TOC]

## Setup

### Docker setup (preferred)

Docker is similar to a virtual machine, and has node pre-installed, so that you don't need to worry about it on your environment.

Download and install **[Docker for Mac or Windows](https://www.docker.com/products/overview)**.  Open up the Docker application to get it set up.

#### Starting the Service in Docker

Run this command in your working directory to build and serve the project.

`docker-compose up`

This will start the BrowserSync server, compile your code, and watch for changes. Pattern Lab will be at **[http://localhost:3000](http://localhost:3000)** and the Browsersync UI will be at **[http://localhost:3001](http://localhost:3001)**.

#### Stopping the Service in Docker

Stop the service and remove any existing containers:

`docker-compose down`

#### Rebuilding the Docker Image

If you make changes that are not picked up automatically by gulp (such as updating dependencies in [`package.json`](package.json)) you will need to rebuild your service. First, stop the service:

`docker-compose down`

Next, rebuild and launch the service:

`docker-compose up --build`

### Local setup

Use this method if for some reason you are unable to run Docker on your machine. All necessary dependencies must be installed manually.

#### Node.js

Download it [here](https://nodejs.org/en/download/). npm comes packaged with it. To verify that it is downloaded correctly, check the versions:

```
node -v
v9.7.1

npm -v
5.6.0
```

Alternatively, you can use `nvm` (node version manager) - install by following the instructions [here](http://nodesource.com/blog/installing-node-js-tutorial-using-nvm-on-mac-os-x-and-ubuntu/).
This will allow you to have multiple versions of node installed on your computer and switch between them for different projects. Just remember which version you used, otherwise you may face issues with your packages (see Troubleshooting).

#### gulp-cli

It should be installed globally. To verify that you have it, outside of this project folder (somewhere where there is no gulpfile.js or package.json), check the version:
```
gulp -v
CLI version 2.0.1
```

If you do not have it, install it:
```
npm install gulpjs/gulp-cli -g
```

#### Installing

After downloading the codebase, from the project root, run:
```
npm install
```

### Configuration Updates

If necessary, you may update the file paths for your project, based on the structure and requirements of your project, in `configs/config.json` - see more specific documentation in [./configs/README.md](./configs/README.md)

## Development

### Docker Development (preferred)

To get the BrowserSync server running, compile your code, and watch for changes (this is the most typical day-to-day command), simply run:

```
docker-compose up
```

If you need to run additional commands inside the container, you can do so with the `docker-compose exec` command:

```
docker-compose exec app [insert commands here]
```

For example, if you wanted to manually compile your code with gulp:

```
docker-compose exec app gulp build
```

Additionally, there is a helper script named [`gulp`](./gulp) included that can be used as a shortcut for running gulp commands inside the container. All of the gulp commands in the [Local Development](#local-development) section can be executed with the shortcut script by replacing `gulp` with `./gulp`.

For example, to manually compile your code with gulp using the shortcut script:

```
./gulp build
```

### Local Development

To get the BrowserSync server running, compile your code, and watch for changes (this is the most typical day-to-day command), simply run:
```
gulp
```

## Other Available Gulp Tasks

### Build

To just compile your code for local development purposes, run:
```
gulp build
```

To just compile a single type of asset, run one of the following:
```
gulp sass
gulp js
gulp images
gulp fonts
gulp json-data
```

### Generators

This project contains a few generator tasks to help create new scss and js files.

To generate all of the scss files necessary for a new partial (and add their imports), run:
```
gulp scss-generate
```

To remove scss files (and their imports), run:
```
gulp scss-ungenerate
```

To generate a new js file (and import it), run:
```
gulp js-generate
```

To remove js files (and their imports), run:
```
gulp js-ungenerate
```

To generate a new pattern file (and the data to go along with it), run:
```
pattern-generate
```

### "Clean" builds

To compile minified code with no sourcemaps (i.e. production ready), run:
```
gulp build-clean
```

or for a single type of asset:
```
gulp sass-clean
gulp js-clean
```

**If you are committing your compiled code, this should be run prior to commits**

### Integration

To copy your code from the "front-end only" area to the final integrated area, after running the clean builds (above) run:

```
gulp integrate
```

or for a single type of asset:
```
gulp integrate-js
gulp integrate-css
gulp integrate-images
gulp integrate-fonts
```

### Other available tasks

To check what tasks are available, you can always run:
```
gulp --tasks
```

To see all "TODO" tasks, run:
```
gulp todos
```


## Troubleshooting

### Node version out of date

```
gulp.task('scss-generate', async function() {
                           ^^^^^

SyntaxError: missing ) after argument list

```

You must have node v > 7.6 - update it.

### Gulp version out of date

```
gulp.task('sass-lint', gulp.series(lintSass));
                            ^

TypeError: gulp.series is not a function
```

Within the project, double check your gulp version (`gulp -v`) - it should be at least version 4.  This version should be provided by our package.json (double check it wasn't inadvertently changed). If the project is not picking up this local version, it implies you may have a global version installed.

Remove the global version, and install the "CLI" (command line interface) instead.  This **can affect other projects** if you were using gulp, you may need to update their dependencies so that the appropriate version is included in that other project.

```
npm rm --global gulp
npm install gulpjs/gulp-cli -g
```

### NPM version changed

```
Node Sass could not find a binding for your current environment: OS X 64-bit with Node.js 8.x

Found bindings for the following environments:
  - OS X 64-bit with Node.js 9.x

This usually happens because your environment has changed since running `npm install`.
```

Delete the node_modules folder, and run `npm install` again, or, if you're using `nvm`, switch to the version of npm you used when building the project (if known).
This happened because your npm version has changed since you last installed the project.

### Running Docker and can't find a node module

```
Try removing your docker volume, and rebuilding your docker image.
```

### Bitbucket pipeline build failure

Make sure the following environment variables are configured for pipelines (**Settings -> Pipelines -> Environment variables**):

* **`AWS_DEFAULT_REGION`**: The region of the AWS account (ex: `us-east-1`)
* **`AWS_ACCESS_KEY_ID`**: The access key ID of the AWS account
* **`AWS_SECRET_ACCESS_KEY`**: The secret access key of the AWS account
* **`BB_AUTH_STRING`**: The auth string containing a bitbucket app password (see [step 1 in this guide](https://confluence.atlassian.com/bitbucket/publish-and-link-your-build-artifacts-872137736.html) for more info)
* **`DEFAULT_BRANCH`**: The branch to be deployed at the root of the s3 bucket (example: `develop`)
* **`PL_URL`**: The url of the hosted pattern library (e.g.: `https://patternlab.aws.reingoldms.com`)
* **`S3_BUCKET_ID`**: The ID of the s3 bucket the static files will be deployed in (ex: `patternlab`)


### Images not appearing on site

If images are not displaying when you're below the root (e.g.`https://patternlab.aws.reingoldms.com/develop/index.html`), but are displaying locally and on the root (e.g. `https://patternlab.aws.reingoldms.com`) you may have an issue with your relative filepaths.

* In CSS, your images should only go up one level (`../visuals/`), as the generated visuals and css folders are siblings.
* In HTML, your asset paths should go up **two** levels (`../../visuals/`), as the generated pattern pages are nested within a folder under patterns (which is the sibling to visuals).

Check the public folder to find the generated files.

### Image task failing due to error with "gulp-imagemin"

The `install.js` script from some plugins did not run, executing the commands below should fix the issue:
(source: https://github.com/sindresorhus/gulp-imagemin/issues/245)

```
node node_modules/jpegtran-bin/lib/install.js
node node_modules/optipng-bin/lib/install.js
```

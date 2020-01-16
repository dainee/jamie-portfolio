# Front-End Baseline Configs

## config.json

*  `autoprefixer`
    *  The options sent into the [gulp-autoprefixer plugin](https://www.npmjs.com/package/gulp-autoprefixer)
*  `browsersync`
    *  The options sent into the [browser-sync plugin](https://www.npmjs.com/package/browser-sync)
*  `esLint`
    *  The options sent into the [gulp-eslint plugin](https://www.npmjs.com/package/gulp-eslint)
*  `sassLint`
    *  The options sent into the [gulp-sass-lint plugin](https://www.npmjs.com/package/gulp-sass-lint)
* `js-compilation`
    *  How the JS files should be handled
    *  `useInstructions`
        *  true/false - Use .txt files to determine the JS files that are compiled together
        * **Recommended method**
    *  `simpleConcat`
        * true/false/string 
        * If true or string is provided, it will concatenate all of the JS files indicated in `filepaths.scriptsSrc` into one file
        * If a string is provided, will use that as the filename, otherwise it will default to `main.js`
    *  `simpleMove`
        * true/false - Simply move the files in their existing file structure from `filepaths.scriptsSrc` to `filepaths.scriptsDest`
*  `filepaths`
    *  **Styles**
        *  `stylesSrcRoot`
            *  The filepath to the parent of all the .scss files to be compiled (passed to pattern lab)
        *  `stylesSrc`
            *  The filepath to all of the .scss files to be compiled 
        *  `stylesSrcVendor`
            *  The filepath to the .scss files that are vendors' (and shouldn't be linted)
        *  `stylesDest`
            *  The filepath where the compiled .css files should go
        *  `stylesSourcePath`
            *  The filepath to where the sass files are (for use in source maps), relative to `stylesDest`
    *  **Scripts**
        *  `scriptsSrcRoot`
            *  The filepath to the parent of all the .js files to be compiled (passed to pattern lab)
        *  `scriptsSrcInstructions`
            *  The filepath to the .txt files that determine how the scripts should be compiled
            *  *Used when `js-compilation.useInstructions` is true*
        *  `scriptsSrc`
            *  The filepath to all of the .js files to be compiled
        *  `scriptsSrcVendor`
            *  The filepath to the .js files that are vendors' (and shouldn't be linted)
        *  `scriptsDest`
            *  The filepath where the compiled .js files should go
    *  **Images**
        *  `imagesSrcRoot`
            *  The filepath to the parent of all the image files to be compiled (passed to pattern lab)
        *  `imagesSrc`
            *  The filepath for the images to be minified
        *  `imagesDest`
            *  The filepath for where the minified images will go
    * **Fonts**
        *  `fontsSrcRoot`
            *  The filepath to the parent of all the font files to be included (passed to pattern lab)
        *  `fontsSrc`
            *  The filepath to all of the font files to be included
        *  `fontsDest`
            *  The filepath for where the font files will go
    * **JSON Data**
        *  `jsonSrc`
            *  The filepath to the partial .json files to be compiled (for pattern lab content)
        *  `jsonDest`
            *  The filepath for where the compiled .json file will go (for pattern lab content)
    *  `todos`
        *  The files that should be crawled to extract TODO comments out of
    *  `integrationSrc`
        *  `css`
            *  The filepath to all of the .css files that should be integrated
        *  `cssSourceMaps`
            *  The filepath to all of the .css.map files that should be integrated
        *  `js`
            *  The filepath to all of the .js files that should be integrated
        *  `images`
            *  The filepath to all of the images files that should be integrated
        *  `fonts`
            *  The filepath to all of the font files that should be integrated
    *  `integrationDest`
        *  `css`
            *  The filepath for the integrated .css files
        *  `cssSourcePath`
            *  The filepath to where the sass files are, relative to `css`, above, (for use in source maps)
        *  `js`
            *  The filepath for the integrated .js files
        *  `images`
            *  The filepath for the integrated image files
        *  `fonts`
            *  The filepath for the integrated font files
    *  **Generators**
        *  `scss-generator`
            *  `placeholder`
                *  A string that will be replaced with the base name provided
                *  (Optional) - default value is `{{!BASE_NAME_GOES_HERE!}}`
            *  `template`
                *  The template for the content of the files generated
                *  *`placeholder` will be replaced*
            *  `destination`
                *  Where the generated files will go
                *  *`placeholder` will be replaced*
            *  `importFrom`
                *  The filepath that will be importing this file
                *  (Optional) - it will not be imported if not provided (and not overwritten by file-specific configs, below)
            *  `importBefore`
                *  If a string is provided, when the files are imported, they will be placed before this content (recommend a unique comment)
                *  If `true`, the import content will be placed in the very beginning of the file
                *  (Optional) - it will not be imported if both this and `importAfter` are not provided (and not overwritten by file-specific configs, below)
            *  `importAfter`
                *  If a string is provided, when the files are imported, they will be placed after this content (recommend a unique comment)
                *  If `true`, the import content will be placed at the very end of the file
                *  (Optional) - it will not be imported if both this and `importBefore` are not provided (and not overwritten by file-specific configs, below)
            *  `importTemplate`
                *  The template to be inserted into the file in order to import the generated file 
                *  (Optional) - it will not be imported if not provided (and not overwritten by file-specific configs, below)
                *  *`placeholder` will be replaced*
            *  `files`
                *  An array of instructions for each file
                *  `name`
                    *  The name of the file to be generated, should include extension
                    *  *placeholder will be replaced*
                *  `template` (Optional file-specific override)
                *  `destination` (Optional file-specific override)
                *  `importFrom` (Optional file-specific override)
                *  `importBefore` (Optional file-specific override)
                *  `importAfter` (Optional file-specific override)
                *  `importTemplate` (Optional file-specific override)
        *  `js-generator`
            *  Same options available as `scss-generator`
            *  Additionally, `defaultImporter` the file that should be the default for `importFrom`
                *  Prompt input will override any provided `importFrom` configs in the `js-generator`
        *  `pattern-generator`
            *  `fileNamePlaceholder`
                *  A string that will be replaced with the file name provided
                *  (Optional) - default value is `{{!FILE_NAME_GOES_HERE!}}`
            *  `jsonNamePlaceholder`
                *  A string that will be replaced with the JSON name provided
                *  (Optional) - default value is `{{!JSON_NAME_GOES_HERE!}}`
            * `mustacheTemplate`
                *  The template for the content of the mustache file generated
                *  *`fileNamePlaceholder` and `jsonNamePlaceholder` will be replaced*
            *  `jsonTemplate`
                *  The template for the content of the json file generated
                *  *placeholder will be replaced*
                *  *`fileNamePlaceholder` and `jsonNamePlaceholder` will be replaced*

/* global process, Buffer, Promise */
/* eslint no-console: 0 */
'use strict';

// All dependencies
var gulp            = require( 'gulp' ),
	browserSync     = require( 'browser-sync' ).create(),
	sass            = require( 'gulp-sass' ),
	sourcemaps      = require( 'gulp-sourcemaps' ),
	autoprefixer    = require( 'gulp-autoprefixer' ),
	gulpif          = require( 'gulp-if' ),
	concat          = require( 'gulp-concat' ),
	rename          = require( 'gulp-rename' ),
	uglify          = require( 'gulp-uglify-es' ).default,
	readFiles       = require( 'read-vinyl-file-stream' ),
	merge           = require( 'merge-stream' ),
	newer           = require( 'gulp-newer' ), // newer deals with the modified timestamp
	cached          = require( 'gulp-cached' ), // cached deals with the file contents
	imagemin        = require( 'gulp-imagemin' ),
	intercept       = require( 'gulp-intercept' ),
	chalk           = require( 'chalk' ),
	todo            = require( 'gulp-todo' ),
	columnify       = require( 'columnify' ),
	tabify          = require( 'gulp-tabify' ),
	sassLint        = require( 'gulp-sass-lint' ),
	csc             = require( 'css-selectors-count' ),
	cleanCSS        = require( 'gulp-clean-css' ),
	eslint          = require( 'gulp-eslint' ),
	prompts         = require( 'prompts' ),
	file            = require( 'gulp-file' ),
	fs              = require( 'fs' ),
	del             = require( 'del' ),
	path            = require( 'path' ),
	argv            = require( 'minimist' )( process.argv.slice( 2 ) ),
	mergeJson       = require( 'gulp-merge-json' ),
	open			= require( 'gulp-open' );

var config = require( './configs/config.json' );



/////
///// Utilities
/////
var debugging = false;
var integrating = false;
function setDebugging( done ) { debugging = true; done(); }
function setClean( done ) { debugging = false; done(); }
function setIntegrating( done ) { integrating = true; done(); }


function trimString( str ) {
	return str.replace( /^\s+/g, '' ).replace( /\s+$/g, '' );
}

// Persist the cache between processes
const CACHE_FILE = './.gulp-cached.json';
try {
	cached.caches = require( CACHE_FILE );
} catch( e ) {
	cached.caches = {};
}

gulp.task( 'cache-clean', function( done ) {
	cached.caches = {};
	var cacheJson = JSON.stringify( cached.caches );
	fs.writeFileSync( CACHE_FILE, cacheJson );
	done();
} );

// Returns an array for 'src' values (will split comma separated strings
function normalizeSrcs( src, negate ) {
	var arr;
	if( typeof src == 'object' ) {
		arr = src;
	} else if( typeof src == 'string' ) {
		arr = src.split( ',' );
	}

	if( negate ) {
		for( var i = 0; i < arr.length; i++ ) {
			// Negate this src if it's not already negative
			if( arr[i].substr( 0, 1 ) != '!' ) {
				arr[i] = '!' + arr[i];
			}
		}
	}

	return arr;
}

function reload( done ) {
	browserSync.reload();
	done();
}

function reloadCSS( done ) {
	browserSync.reload( '*.css' );
	done();
}


/////
///// SCSS to CSS
/////
function compileSass() {
	var sassOptions = {};

	if( !debugging ) {
		sassOptions.outputStyle = 'compressed';
	}

	return gulp.src( normalizeSrcs( config.filepaths.stylesSrc ), { allowEmpty: true } )
		.pipe( gulpif( ( debugging || ( integrating && config.generateMapsOnIntegration ) ), sourcemaps.init() ) )
		.pipe( sass( sassOptions ).on( 'error', sass.logError ) ) // compile
		// only proceed with the css files that have been updated
		.pipe( cached( 'css', { optimizeMemory: true } ) )
		.pipe( autoprefixer( config.autoprefixer ) ) // add prefixes
		// check that there are not too many selectors (IE limitation)
		.pipe( intercept( function( file ) {
			var selectors = csc( file.contents.toString() ).selectors;
			const defaultOpts = { 'ie9': true, 'ie10': true };
			const IE9_LIMIT = 4095;
			const IE10_LIMIT = 65534;
			var opts = {...defaultOpts, ...config.selectorCounter};
			var errorMsg = '';

			if( opts.ie9 && selectors > IE9_LIMIT ) {
				errorMsg += chalk.bold( '\t✖ Number of selectors in ' ) + chalk.underline( file.path ) + chalk.bold( ' exceeds limitations for Internet Explorer 9' );
				errorMsg += '\n\t  Limit: ' + IE9_LIMIT + '; Count: ' + selectors;
			}

			if( opts.ie10 && selectors > IE10_LIMIT ) {
				errorMsg += chalk.bold( '\n\t✖ Number of selectors in ' ) + chalk.underline( file.path ) + chalk.bold( ' exceeds limitations for Internet Explorer 10' );
				errorMsg += '\n\t  Limit: ' + IE10_LIMIT + '; Count: ' + selectors;
			}

			if( errorMsg.length ) {
				console.log( chalk.red( '\n' + errorMsg + '\n' ) );
			} else if( opts.debug ) {
				console.log( chalk.gray( '\n\tSelector Count: ' + chalk.bold.black( selectors ) + ' in ' + chalk.underline( file.path ) + '\n' ) );
			}

			return file;
		} ) )
		.pipe( gulpif( !debugging, cleanCSS( { rebase: false } ) ) ) // minify it
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( gulpif( ( debugging || ( integrating && config.generateMapsOnIntegration ) ), sourcemaps.mapSources( function( sourcePath /*, file*/ ) {
			var prefix = '';
			if( integrating ) {
				prefix = config.filepaths.integrationDest.cssSourcePath;
			} else {
				prefix = config.filepaths.stylesSourcePath;
			}
			return prefix + sourcePath;
		} ) ) )
		.pipe( gulpif( ( debugging || ( integrating && config.generateMapsOnIntegration ) ), sourcemaps.write( '.' ) ) ) // add sourcemap files
		.pipe( gulp.dest( config.filepaths.stylesDest ) )
		.pipe( intercept( function( file ) {

			console.log( chalk.bold( 'Compiled ' ) + chalk.underline.gray( file.path ) );

			// Update file modification and access time (sass does not)
			// https://github.com/zurb/foundation-sites/issues/8544#issuecomment-219669458
			fs.utimesSync( file.path, new Date(), new Date() );
			return file;
		} ) )
		.pipe( gulpif( debugging, browserSync.stream() ) )
		.on( 'end', function() {
			var cacheJson = JSON.stringify( cached.caches );
			fs.writeFileSync( CACHE_FILE, cacheJson );
		} );
}

function lintSass() {
	return gulp.src( normalizeSrcs( config.filepaths.stylesSrc ).concat( normalizeSrcs( config.filepaths.stylesSrcVendor, true ) ), { allowEmpty: true } )
		.pipe( tabify( 4, false ) )
		.pipe( sassLint( config.sassLint ) )
		.pipe( sassLint.format() )
		.on( 'end', function() {
			var cacheJson = JSON.stringify( cached.caches );
			fs.writeFileSync( CACHE_FILE, cacheJson );
		} );
}

gulp.task( 'sass-lint', gulp.series( lintSass ) );
gulp.task( 'sass-clean', gulp.series( setClean, compileSass ) );
gulp.task( 'sass', gulp.series( setDebugging, 'sass-lint', compileSass ) );



/////
///// Individual JS files + .txt instructions to compiled JS files
/////

// Keep track of the dynamically generated tasks
var jsFileTasks = [];

// Read through all of the .txt instructions
function readAllJSInstructions() {
	jsFileTasks = [];
	return gulp.src( normalizeSrcs( config.filepaths.scriptsSrcInstructions ), { allowEmpty: true } )
		.pipe( readFiles( function( content, file, stream, callback ) {
			readJSInstructions.apply( this, [content, file, callback] );
		} ) );
}

// Read which files should be included from the .txt file (separated by spaces )
function readJSInstructions( content, file, callback ) {
	
	// Remove comments
	content = content.replace( /^#.*$/gm, '' );

	// Remove spaces, then replace line breaks with spaces
	var trimmed = trimString( content ).replace( /\n/g, ' ' ).replace( /\s\s/g, ' ' );

	if( !trimmed.length ) {
		console.log( chalk.yellow( '\n\t✖ No files listed in ' + chalk.underline( file.stem + '.txt' ) + ', will not compile file to JS\n' ) );

		callback( null, content );
		return false;
	}

	var filePaths = trimmed.split( /\s+/ );

	// Get the path of these instructions, relative to the source root
	var relPath = normalizePath( file.path ).replace( normalizePath( config.filepaths.scriptsSrcRoot ), '' );
	relPath = relPath.replace( file.stem + '.txt', '' ); // Remove the filename from the path
	if( relPath.length && relPath[0] == '/' ) {
		relPath = relPath.substring(1);
	}

	var taskName = 'js:'+file.stem;

	while( jsFileTasks.indexOf( taskName ) >= 0 ) {
		// Duplicate task names - tack something on to make this unique-r
		taskName += '_2';
	}
	
	var success = createJSTask( taskName, file.stem+'.js', filePaths, relPath );

	if( success ) {
		jsFileTasks.push( taskName );
	}

	callback( null, content );
}

// Create tasks to compile the js files
function createJSTask( taskName, fileName, filePaths ) {
	var invalidFilepaths = [];
	var i;
	for( i = filePaths.length - 1; i >= 0; i-- ) {
		if ( !fs.existsSync( filePaths[i] ) ) {
			invalidFilepaths.unshift( filePaths[i] );
			filePaths.splice( i, 1 );
		}
	}

	// Print out the invalid ones in order
	for( i = 0; i < invalidFilepaths.length; i++ ) {
		console.log( chalk.red.bold( '\n\t✖ FILE REFERENCED IN ' + chalk.underline( taskName + '.txt' ) + ' DOES NOT EXIST' ) + ' ' + chalk.gray( '('+invalidFilepaths[i]+')' ) + '\n' );
	}

	if( filePaths.length ) {
		var runCompilationTask = function() {
			return compileJSFile( fileName, filePaths );
		};
		gulp.task( taskName, runCompilationTask );

		return true;
	}

	return false;
}

// Create a compiled js file from multiple other files
function compileJSFile( fileName, filePaths, destPath ) {
	return gulp.src( normalizeSrcs( filePaths ), { allowEmpty: true } )
		.pipe( gulpif( ( debugging || ( integrating && config.generateMapsOnIntegration ) ), sourcemaps.init() ) )
		.pipe( concat( fileName ) )
		.pipe( gulpif( ( !debugging || integrating ), uglify() ) ) // This runs slow, only minify when clean code is requested
		.pipe( gulpif( ( debugging || ( integrating && config.generateMapsOnIntegration ) ), sourcemaps.mapSources( function( sourcePath ) {
			var prefix = '';
			if( integrating ) {
				prefix = config.filepaths.integrationDest.jsSourcePath;
			} else {
				prefix = config.filepaths.scriptsSourcePath;
			}
			return prefix + sourcePath;
		} ) ) )
		.pipe( gulpif( ( debugging || ( integrating && config.generateMapsOnIntegration ) ), sourcemaps.write( '.' ) ) ) // add sourcemap files
		.pipe( gulp.dest( destPath ? config.filepaths.scriptsDest + destPath : config.filepaths.scriptsDest ) )
		.pipe( intercept( function( file ) {
			console.log( chalk.bold( 'Compiled ' ) + chalk.underline.gray( file.path ) );
		} ) );
}

// Because the jsFileTasks are not defined until after readAllJSInstructions is defined, need to run them a little differently
function runAllDynamicJSTasks( done ) {
	if( jsFileTasks.length ) {
		( gulp.series(
			gulp.parallel.apply( gulp, jsFileTasks )
		) )( done );
	} else {
		done();
	}
}

function lintScripts() {
	return gulp.src( normalizeSrcs( config.filepaths.scriptsSrc ).concat( normalizeSrcs( config.filepaths.scriptsSrcVendor, true ) ), { allowEmpty: true } )
		.pipe( eslint( config.esLint ) )
		.pipe( eslint.format() )
		.on( 'end', function() {
			var cacheJson = JSON.stringify( cached.caches );
			fs.writeFileSync( CACHE_FILE, cacheJson );
		} );
}

function concatJSFiles() {
	var name = ( config['js-compilation'] ? config['js-compilation'].simpleConcat : null );
	name = ( typeof name == 'string' ? name : 'main.js' ); // default to main.js
	return compileJSFile( name, config.filepaths.scriptsSrc );
}

function moveJSFiles() {
	return gulp.src( normalizeSrcs( config.filepaths.scriptsSrc ), { allowEmpty: true } )
		.pipe( gulp.dest( config.filepaths.scriptsDest ) );
}

function nothingJS( done ) {
	console.log( chalk.red.bold( '\n\t✖ Didn\'t do anything with the JS files - need configuration' ) + '\n' );
	done();
}

// Based on the configs, determine how the JS tasks are handled
function determineJSCompilation( clean ) {
	if( config['js-compilation'].useInstructions ) {
		if( clean ) {
			return gulp.series( setClean, readAllJSInstructions, runAllDynamicJSTasks );
		} else {
			return gulp.series( setDebugging, 'js-lint', readAllJSInstructions, runAllDynamicJSTasks );
		}
	} else if( config['js-compilation'].simpleConcat ) {
		if( clean ) {
			return gulp.series( setClean, concatJSFiles );
		} else {
			return gulp.series( setDebugging, concatJSFiles );
		}
	} else if( config['js-compilation'].simpleMove ) {
		if( clean ) {
			return gulp.series( setClean, moveJSFiles );
		} else {
			return gulp.series( setDebugging, moveJSFiles );
		}
	} else {
		return gulp.series( nothingJS );
	}
}

gulp.task( 'js-lint', gulp.series( lintScripts ) );
gulp.task( 'js-clean', determineJSCompilation( true ) );
gulp.task( 'js', determineJSCompilation() );



/////
///// Image Optimization
/////

function processImages( whichImages, imagesDest ) {
	return gulp.src( normalizeSrcs( whichImages ), { allowEmpty: true } )
		.pipe( newer( imagesDest ) )
		.pipe( intercept( function( file ){
			if( !file.isDirectory() ) {
				var path = file.path;
				var fileName = path;

				path = path.split( '/' );
				if( path.length ) {
					fileName = path[path.length - 1];
				}

				console.log( chalk.yellow( 'Minimizing ' ) + chalk.yellow.underline( fileName ) + chalk.yellow( '... this sometimes takes a while' ) + chalk.gray( ' (but will only happen when the image is updated)' ) );
			}
			return file;
		} ) )
		.pipe( imagemin( [
			imagemin.gifsicle( { interlaced: true } ),
			imagemin.jpegtran( { progressive: true } ),
			imagemin.optipng( { optimizationLevel: 5 } ),
			imagemin.svgo( {
				plugins: [
					{ removeViewBox: true },
					{ cleanupIDs: false }
				]
			} )
		] ) )
		.pipe( gulp.dest( imagesDest ) );
}

gulp.task( 'images', function() {
	return processImages( normalizeSrcs( config.filepaths.imagesSrc ), config.filepaths.imagesDest );
} );



/////
///// Fonts
/////
gulp.task( 'fonts', function() {
	return gulp.src( normalizeSrcs( config.filepaths.fontsSrc ), { allowEmpty: true } )
		.pipe( newer( config.filepaths.fontsDest ) )
		.pipe( gulp.dest( config.filepaths.fontsDest ) );
} );



/////
///// Static Endpoints
/////
gulp.task( 'endpoints', function() {
	return gulp.src( normalizeSrcs( config.filepaths.endpointsSrc ), { allowEmpty: true } )
		.pipe( newer( config.filepaths.endpointsDest ) )
		.pipe( gulp.dest( config.filepaths.endpointsDest ) );
} );



/////
///// Extraction of TODO Comments
/////
function jsInstructionsParser( contents, file ) {
	const allLines = contents.split( '\n' );
	var commentArr = [];

	for( var i = 0; i < allLines.length; i++ ) {
		var line = allLines[i];

		// Is this line a comment?
		if( line.length && line[0] == '#' ) {
			// What kind of comment
			const CAPTURING_TYPES = ['TODO', 'FIXME'];
			var commentType = null;
			var re;

			for( var j = 0; j < CAPTURING_TYPES.length; j++ ) {
				re = new RegExp( '^#\\s*' + CAPTURING_TYPES[j], 'gmi' );

				if( line.match( re ) ) {
					commentType = CAPTURING_TYPES[j];
					break;
				}
			}

			if( commentType ) {

				var text;
				re = new RegExp( '^#\\s*' + commentType + ':?\\s*', 'gmi' );
				text = trimString( line.replace( re, '' ) );

				commentArr.push( {
					file: file,
					kind: commentType,
					line: i + 1,
					text: text,
					ref: ''
				} );
			}
		}
	}

	return commentArr;
}

gulp.task( 'todos', function() {
	return gulp.src( 
		normalizeSrcs( config.filepaths.todos )
			.concat( normalizeSrcs( config.filepaths.stylesSrcVendor, true ) )
			.concat( normalizeSrcs( config.filepaths.scriptsSrcVendor, true ) ),
		{ allowEmpty: true }
	)
		.pipe( todo( {
			reporter: 'table',
			associateParser: {
				'.txt': {
					parserName: 'jsInstructions'
				}
			},
			customParsers: {
				jsInstructions: function () {
					return jsInstructionsParser;
				}
			}
		} ) )
		.pipe( intercept( function( file ){
			var numTodos = file.todos.length;
			if( numTodos ) {
				var formattedTable = [];
				for( var i = 0; i < numTodos; i++ ) {
					var kind = chalk.cyan( file.todos[i].kind + ':' );
					var location = chalk.gray( file.todos[i].file + ':' + file.todos[i].line );

					if( i % 2 === 1 ) {
						kind = chalk.inverse( kind );
						location = chalk.inverse( location );
					}

					var row = {
						'message': kind + ' ' + file.todos[i].text,
						'location': location
					};

					formattedTable.push( row );
				}

				console.log( '\n'+
					columnify(
						formattedTable,
						{
							showHeaders: false,
							columnSplitter: ' | ',
							config: {
								message: {
									minWidth: 30,
									maxWidth: 100
								}
							}
						}
					)+'\n'
				);
			}
			return file;
		} ) );
} );



/////
///// Automated creation of files
/////

// Add the import statements to the parent files
function addImportForFile( importFrom, str, before, after ) {
	return gulp.src( normalizeSrcs( importFrom ), { allowEmpty: true } )
		.pipe( intercept( function( file ) {
			var oldContent = file.contents.toString();
			var findStr;
			if( before ) {
				findStr = oldContent.indexOf( before );
			} else if( after ) {
				findStr = oldContent.indexOf( after );
			}

			var newContent;
			if( findStr < 0 ) {
				if( before ) {
					newContent = str + oldContent; // put it at the beginning of the file
				} else {
					newContent = oldContent + str; // put it at the end of the file
				}
			} else {
				if( before ) {
					newContent = oldContent.substr( 0, findStr ) + str + oldContent.substr( findStr ); // put it before the indicated content
				} else {
					var endOfStr = findStr + findStr.length;
					newContent = oldContent.substr( 0, endOfStr ) + str + oldContent.substr( endOfStr ); // put it after the indicated content
				}
			}

			file.contents = new Buffer.from( newContent );
			return file;
		} ) )
		.pipe( gulp.dest( function( file ) {
			return file.base;
		} ) )
		.pipe( intercept( function( file ) {
			console.log( chalk.green( '✔ New file is included in: ' + chalk.underline( importFrom ) ) );
			return file;
		} ) );
}

// Remove the import statements from the parent files
function removeImportForFile( importFrom, str ) {
	return gulp.src( normalizeSrcs( importFrom ), { allowEmpty: true } )
		.pipe( intercept( function( file ) {
			var oldContent = file.contents.toString();
			var findStr = oldContent.indexOf( str );

			var newContent;
			if( findStr >= 0 ) {
				newContent = oldContent.substr( 0, findStr ) + oldContent.substr( findStr + str.length );
			}

			file.contents = new Buffer.from( newContent );
			return file;
		} ) )
		.pipe( gulp.dest( function( file ) {
			return file.base;
		} ) )
		.pipe( intercept( function( file ) {
			console.log( chalk.green( '✔ Import removed from: ' + chalk.underline( importFrom ) ) );
			return file;
		} ) );
}

// Remove all imports for a specific config
function removeImports( whichConfig, base, importFromOverride ){
	const PLACEHOLDER = whichConfig.placeholder ? whichConfig.placeholder : '{{!BASE_NAME_GOES_HERE!}}';

	var importFrom = whichConfig.importFrom || null;
	var importTemplate = whichConfig.importTemplate || null;
	var re = new RegExp( PLACEHOLDER, 'g' );

	var stream = merge();

	for( var i = 0; i < whichConfig.files.length; i++ ) {
		var file = whichConfig.files[i];
		
		if( base.length ) {
			// Using file-specific overrides, remove the import
			var importTemplateOverride = ( file.importTemplate ? file.importTemplate : importTemplate ).replace( re, base );
			var importThisFileFromOverride = importFromOverride ? importFromOverride : ( file.importFrom ? file.importFrom : importFrom ); // the parameter trumps all
			if( importTemplateOverride && importThisFileFromOverride ) {
				stream.add( removeImportForFile( importThisFileFromOverride, importTemplateOverride ) );
			}
		}
	}

	return stream;
}

// Create a single file
function generateFile( filename, contents, dest ) {
	return file( filename, contents, { src: true } )
		.pipe( gulp.dest( dest ) )
		.pipe( intercept( function( file ) {
			console.log( chalk.green( '✔ File generated: ' + chalk.underline( dest + ( dest[dest.length - 1] == '/' ? '' : '/' ) + filename ) ) );
			return file;
		} ) )
		.pipe( open() );
}

// Generate all files and update import files for a specific config
function generateFiles( whichConfig, base, importFromOverride ) {
	const PLACEHOLDER = whichConfig.placeholder ? whichConfig.placeholder : '{{!BASE_NAME_GOES_HERE!}}';

	var template = whichConfig.template || null;
	var destination = whichConfig.destination || null;
	var importBefore = whichConfig.importBefore || null;
	var importAfter = whichConfig.importAfter || null;
	var importFrom = whichConfig.importFrom || null;
	var importTemplate = whichConfig.importTemplate || null;
	var re = new RegExp( PLACEHOLDER, 'g' );

	var stream = merge();

	for( var i = 0; i < whichConfig.files.length; i++ ) {
		var file = whichConfig.files[i];

		var filename = file.name.length ? file.name.replace( re, base ) : null;
		var templateOverride = ( file.template ? file.template : template ).replace( re, base );
		var destinationOverride = ( file.destination ? file.destination : destination ).replace( re, base );
		var fullFilepath = destinationOverride + ( destinationOverride[destinationOverride.length - 1] == '/' ? '' : '/' ) + filename;

		if ( fs.existsSync( fullFilepath ) ) {
			console.log( chalk.red.bold( '\n\t✖ FILE ALREADY EXISTS - CHOOSE A DIFFERENT BASE NAME' ) + ' ' + chalk.gray( '( '+fullFilepath+' )' ) + '\n' );
			break;
		} else if( base.length && filename && templateOverride && destinationOverride ) {
			// Generate the file
			stream.add( generateFile( filename, templateOverride, destinationOverride ) );

			// And then import it, using file-specific overrides
			var importBeforeOverride = ( file.importBefore ? file.importBefore : importBefore );
			var importAfterOverride = ( file.importAfter ? file.importAfter : importAfter );
			var importTemplateOverride = ( file.importTemplate ? file.importTemplate : importTemplate ).replace( re, base );
			var importThisFileFromOverride = importFromOverride ? importFromOverride : ( file.importFrom ? file.importFrom : importFrom ); // the parameter trumps all
			if( ( importBeforeOverride || importAfterOverride ) && importTemplateOverride && importThisFileFromOverride ) {
				stream.add( addImportForFile( importThisFileFromOverride, importTemplateOverride, importBeforeOverride, importAfterOverride ) );
			} else {
				console.log( chalk.yellow.bold( '\t✖ Nothing is importing ' ) + chalk.underline( fullFilepath ) + ' ' + chalk.gray( '(not enough information provided)' ) );
			}
		} else {
			console.log( chalk.red.bold( '\n\t✖ Error generating file ' + chalk.underline( fullFilepath ) ) );
		}
	}

	return stream;
}

// Remove files that were generated using a specific config
async function removeFiles( whichConfig, base ) {
	const PLACEHOLDER = whichConfig.placeholder ? whichConfig.placeholder : '{{!BASE_NAME_GOES_HERE!}}';
	var destination = whichConfig.destination || null;
	var re = new RegExp( PLACEHOLDER, 'g' );
	var deleteFiles = [];

	for( var i = 0; i < whichConfig.files.length; i++ ) {
		var file = whichConfig.files[i];

		var filename = file.name.length ? file.name.replace( re, base ) : null;
		var destinationOverride = ( file.destination ? file.destination : destination ).replace( re, base );
		var fullFilepath = destinationOverride + ( destinationOverride[destinationOverride.length - 1] == '/' ? '' : '/' ) + filename;
		
		if ( fs.existsSync( fullFilepath ) ) {
			deleteFiles.push( fullFilepath );
		}
	}

	var files = del.sync( deleteFiles, {dryRun: true} );

	if( files.length ) {
		return await confirmDeletionOfFiles( files );
	} else {
		console.log( chalk.red.bold( '✖ No files exist based on that name.' ) );
	}

	return false;
}
	
// Confirm that files should be deleted
async function confirmDeletionOfFiles( paths ) {
	var response = await prompts( {
		type: 'confirm',
		name: 'confirmed',
		message: 'The following files will be deleted:' 
			+ chalk.dim( '\n\t' + paths.join( '\n\t' ) )
			+ chalk.bold( '\nAre you sure you want to proceed?' )
	} );

	if( response.confirmed ) {
		del.sync( paths );

		// Since all paths belong to the same directory, get that directory's name from the first one
		var dirName = paths[0].split( '/' );
		dirName.pop();
		dirName = dirName.join( '/' ) + '/';

		/// Delete the directory if it is empty
		try {
			var files = fs.readdirSync( dirName );

			if( !files || !files.length ) {
				del.sync( dirName );
				console.log( chalk.dim( '\tDirectory is now empty, removed', dirName ) );
			}
		} catch ( e ) {
			console.log( chalk.dim( '\tError deleting directory', dirName ) );
		}

		return true;
	} else {
		return false;
	}
}

// Normalize the scss file base name
function formatSCSSbaseName( val ) {
	return val
		.replace( /^\s*/g, '' ).replace( /\s*$/g, '' ) // trim
		.replace( /\s/g, '-' ) // convert spaces to hyphens
		.replace( /\.scss$/, '' ) // remove scss file extension
		.replace( /\.css$/, '' ) // remove css file extension
		.toLowerCase();
}

// Prompt the user for a name and follow instructions in config file for what to create
gulp.task( 'scss-generate', async function( done ) {
	var response = await prompts( {
		type: 'text',
		name: 'basename',
		message: 'What base name should be used for your scss files?',
		format: formatSCSSbaseName
	} );

	if( response.basename && response.basename.length ) {
		return generateFiles( config['scss-generator'], response.basename );
	} else {
		console.log( chalk.red.bold( '✖ Did not create a file - not enough information.' ) );
		done();
	}
} );


// Prompt the user for a name and follow instructions in config file for what to remove
gulp.task( 'scss-ungenerate', async function( done ) {
	var response = await prompts( {
		type: 'text',
		name: 'basename',
		message: 'What base name should be removed from your scss files?',
		format: formatSCSSbaseName
	} );

	var successfullyRemoved = false;

	if( response.basename && response.basename.length ) {
		successfullyRemoved = await removeFiles( config['scss-generator'], response.basename );

		if( successfullyRemoved ) {
			removeImports( config['scss-generator'], response.basename );
		}
	}

	if( successfullyRemoved ) {
		console.log( chalk.green( '✔ Removed scss files.' ) );
	} else {
		console.log( chalk.red.bold( '✖ Failed to delete scss files.' ) );
	}

	done();
} );


gulp.task( 'js-generate', async function( done ) {
	var response = await prompts( [{
		type: 'text',
		name: 'basename',
		message: 'What is the name of your js file?',
		format: val => {
			return val
				.replace( /^\s*/g, '' ).replace( /\s*$/g, '' ) // trim
				.replace( /\s/g, '-' ) // convert spaces to hyphens
				.replace( /\.js$/, '' ) // remove js file extension
				.toLowerCase();
		}
	},{
		type: 'text',
		name: 'importFrom',
		message: 'Which JS file should import this?',
		initial: ( config['js-generator'].defaultImporter || false ),
		format: val => val.replace( /^\s*/g, '' ).replace( /\s*$/g, '' ) // trim
	}] );

	if( response.basename ) {
		return generateFiles( config['js-generator'], response.basename, response.importFrom );
	} else {
		console.log( chalk.red.bold( '✖ Did not create a file - not enough information.' ) );
		done();
	}
} );

gulp.task( 'js-ungenerate', async function( done ) {
	var response = await prompts( [{
		type: 'text',
		name: 'basename',
		message: 'What is the name of js file to delete?',
		format: val => {
			return val
				.replace( /^\s*/g, '' ).replace( /\s*$/g, '' ) // trim
				.replace( /\s/g, '-' ) // convert spaces to hyphens
				.replace( /\.js$/, '' ) // remove js file extension
				.toLowerCase();
		}
	},{
		type: 'text',
		name: 'importFrom',
		message: 'Which JS file is importing this?',
		initial: ( config['js-generator'].defaultImporter || false ),
		format: val => val.replace( /^\s*/g, '' ).replace( /\s*$/g, '' ) // trim
	}] );

	var successfullyRemoved = false;

	if( response.basename ) {
		if( response.basename && response.basename.length ) {
			successfullyRemoved = await removeFiles( config['js-generator'], response.basename );

			if( successfullyRemoved ) {
				removeImports( config['js-generator'], response.basename, response.importFrom );
			}
		}

		if( successfullyRemoved ) {
			console.log( chalk.green( '✔ Removed js file.' ) );
		} else {
			console.log( chalk.red.bold( '✖ Failed to delete js file.' ) );
		}
	}

	done();
} );


function generatePatternFiles( whichConfig, filePath, fileName, adjacentData ) {
	const FILENAME_PLACEHOLDER = whichConfig.fileNamePlaceholder ? whichConfig.fileNamePlaceholder : '{{!FILE_NAME_GOES_HERE!}}';
	var regFilename = new RegExp( FILENAME_PLACEHOLDER, 'g' );
	const JSONNAME_PLACEHOLDER = whichConfig.jsonNamePlaceholder ? whichConfig.jsonNamePlaceholder : '{{!JSON_NAME_GOES_HERE!}}';
	var regJson = new RegExp( JSONNAME_PLACEHOLDER, 'g' );

	var stream = merge();

	var patternFilepath = normalizePath( paths().source.patterns + filePath + ( filePath[filePath.length - 1] == '/' ? '' : '/' ) );
	var dataFilepath;
	if( adjacentData ){
		dataFilepath = patternFilepath;
	} else {
		dataFilepath = normalizePath( paths().source.data + '/partials/' + filePath + ( filePath[filePath.length - 1] == '/' ? '' : '/' ) );
	}

	var patternFilename = fileName + '.mustache';
	var dataFilename = fileName + '.json';

	var fullPatternFilepath = normalizePath( patternFilepath + patternFilename );
	var fullDataFilepath = normalizePath( dataFilepath + dataFilename );

	var jsonName = fileName.replace( /\s/g, '' ); // remove any spaces
	jsonName = jsonName.replace( /^\d*-/, '' ); // remove the leading numbers and hyphen
	jsonName = jsonName[0].toLowerCase() + jsonName.substr( 1 ); // lowercase the first letter
	jsonName = jsonName.replace( /-([a-z])/gi, function ( $0, $1 ) { return $1.toUpperCase(); } ); // convert to camel case (e.g. "camel-case" becomes "camelCase")


	var patternTemplate = whichConfig.mustacheTemplate.replace( regFilename, fileName ).replace( regJson, jsonName );
	var dataTemplate = whichConfig.jsonTemplate.replace( regFilename, fileName ).replace( regJson, jsonName );

	if ( fs.existsSync( fullPatternFilepath ) ) {
		console.log( chalk.red.bold( '\n\t✖ FILE ALREADY EXISTS - CHOOSE A DIFFERENT PATTERN NAME' ) + ' ' + chalk.gray( '(' + fullPatternFilepath + ')' ) + '\n' );
	} else if ( fs.existsSync( fullDataFilepath ) ) {
		console.log( chalk.red.bold( '\n\t✖ FILE ALREADY EXISTS - CHOOSE A DIFFERENT PATTERN NAME' ) + ' ' + chalk.gray( '(' + fullDataFilepath + ')' ) + '\n' );
	} else if( patternFilename && jsonName && patternFilepath && dataFilename && dataFilepath ) {
		// Generate the pattern file
		stream.add( generateFile( patternFilename, patternTemplate, patternFilepath ) );

		// Generate the data file
		stream.add( generateFile( dataFilename, dataTemplate, dataFilepath ) );
	}

	return stream;
}

gulp.task( 'pattern-generate', gulp.series( loadPatternlab, async function( done ) {
	var response = await prompts( [{
		type: 'text',
		name: 'name',
		message: 'What is the name of your pattern?',
		format: val => {
			return val
				.replace( /^\s*/g, '' ).replace( /\s*$/g, '' ) // trim
				.replace( /\s/g, '-' ) // convert spaces to hyphens
				.replace( /\.mustache$/, '' ) // remove mustache file extension
				.replace( /^\d*-?/, '' ) // remove preceding numbers
				.toLowerCase();
		}
	},{
		type: 'select',
		name: 'patternType',
		message: 'What type of pattern is this?',
		choices: [
			{ title: 'atom',        value: '00-atoms' },
			{ title: 'molecule',    value: '01-molecules' },
			{ title: 'organism',    value: '02-organisms' },
			{ title: 'template',    value: '03-templates' },
			{ title: 'page',        value: '04-pages' }
		],
		initial: 0
	},{
		type: 'text',
		name: 'folder',
		message: 'What folder should this be placed in?',
		format: val => {
			return val
				.replace( /^\s*/g, '' ).replace( /\s*$/g, '' ) // trim
				.replace( /\s/g, '-' ) // convert spaces to hyphens
				.toLowerCase();
		}
	},{
		type: 'number',
		name: 'order',
		message: 'What number should be given to this pattern? (0-99; influences the order it shows up)',
		initial: 0,
		format: val => {
			val = Math.round( val );
			val = ( val > 99 ) ? 99 : val;
			val = ( val < 10 ) ? ( '0' + Math.max( val, 0 ) ) : ( '' + val );
			return val;
		}
	}] );

	if(
		response.name && response.name.length
		&& response.folder && response.folder.length
		&& response.patternType
		&& response.order.length
	) {
		var filePath = response.patternType + '/' + response.folder + '/';
		var fileName = response.order + '-' + response.name;

		return generatePatternFiles( config['pattern-generator'], filePath, fileName, ( response.patternType == '04-pages' ) );
	} else {
		console.log( chalk.red.bold( '✖ Did not create files - not enough information.' ) );
		done();
	}
} ) );



/////
///// Combining JSON for Pattern Lab into data.json
/////

var dataFilepath = config.filepaths.jsonDest + config.mergeJson.fileName;

gulp.task( 'json-data', function() {

	if( typeof config.mergeJson.startObj == 'undefined' || !config.mergeJson.startObj ) {
		var cacheBuster = null;

		if( !integrating ) {
			cacheBuster = ( new Date() ).getTime();
		}

		config.mergeJson.startObj = {
			'sgCacheBuster': cacheBuster,
			'integrating': integrating
		};
	}

	var currentData;
	try { currentData = require( config.filepaths.jsonDest + config.mergeJson.fileName ); }
	catch( e ) { currentData = {}; }

	var forceUpdate = currentData.integrating && !integrating;

	return gulp.src( normalizeSrcs( config.filepaths.jsonSrc ) )
		.pipe( gulpif( !integrating && !forceUpdate, newer( dataFilepath ) ) )
		.pipe( mergeJson( config.mergeJson ) )
		.pipe( gulp.dest( config.filepaths.jsonDest ) )
		.pipe( intercept( function( file ) {
			console.log( chalk.green( '✔ Updated ' + chalk.underline( dataFilepath ) ) );
			return file;
		} ) );
} );



/////
///// Pattern Lab
/////

var plConfig;
var patternlab;
function loadPatternlab( done ) {
	if( plConfig ) {
		done();
		return;
	}

	//read all paths from our namespaced config file
	plConfig = require( './configs/patternlab-config.json' );

	// Populate the pl config with custom configurations
	plConfig.paths.source.js = config.filepaths.scriptsSrcRoot;
	plConfig.paths.source.images = config.filepaths.imagesSrcRoot;
	plConfig.paths.source.fonts = config.filepaths.fontSrcRoot;
	plConfig.paths.source.css = config.filepaths.stylesSrcRoot;

	plConfig.paths.public.js = config.filepaths.scriptsDest;
	plConfig.paths.public.images = config.filepaths.imagesDest;
	plConfig.paths.public.fonts = config.filepaths.fontsDest;
	plConfig.paths.public.css = config.filepaths.stylesDest;

	patternlab = require( 'patternlab-node' )( plConfig );

	done();
}

// Styleguide Copy everything but css
gulp.task( 'pl-copy:styleguide', gulp.series( loadPatternlab, function () {
	return gulp.src( normalizePath( paths().source.styleguide ) + '/**/!(*.css)' )
		.pipe( gulp.dest( normalizePath( paths().public.root ) ) )
		.pipe( browserSync.stream() );
} ) );

// Styleguide Copy and flatten css
gulp.task( 'pl-copy:styleguide-css', gulp.series( loadPatternlab, function () {
	return gulp.src( normalizePath( paths().source.styleguide ) + '/**/*.css' )
		.pipe( gulp.dest( function ( file ) {
			//flatten anything inside the styleguide into a single output dir per http://stackoverflow.com/a/34317320/1790362
			file.path = path.join( file.base, path.basename( file.path ) );
			return normalizePath( path.join( paths().public.styleguide, '/css' ) );
		} ) )
		.pipe( browserSync.stream() );
} ) );



/**
 * Normalize all paths to be plain, paths with no leading './',
 * relative to the process root, and with backslashes converted to
 * forward slashes. Should work regardless of how the path was
 * written. Accepts any number of parameters, and passes them along to
 * path.resolve().
 *
 * This is intended to avoid all known limitations of gulp.watch().
 *
 * @param {...string} pathFragment - A directory, filename, or glob.
*/
function normalizePath() {
	return path
		.relative(
			process.cwd(),
			path.resolve.apply( this, arguments )
		)
		.replace( /\\/g, '/' );
}

function paths() {
	return plConfig.paths;
}

function getConfiguredCleanOption() {
	return plConfig.cleanPublic;
}

/**
 * Performs the actual build step. Accomodates both async and sync
 * versions of Pattern Lab.
 * @param {function} done - Gulp done callback
 */
function build( done ) {
	const buildResult = patternlab.build( () => {}, getConfiguredCleanOption() );

	// handle async version of Pattern Lab
	if ( buildResult instanceof Promise ) {
		return buildResult.then( done );
	}

	// handle sync version of Pattern Lab
	done();
	return null;
}

gulp.task( 'patternlab:version', gulp.series( loadPatternlab, function ( done ) {
	patternlab.version();
	done();
} ) );

gulp.task( 'patternlab:help', gulp.series( loadPatternlab, function ( done ) {
	patternlab.help();
	done();
} ) );

gulp.task( 'patternlab:patternsonly', gulp.series( loadPatternlab, function ( done ) {
	patternlab.patternsonly( done, getConfiguredCleanOption() );
} ) );

gulp.task( 'patternlab:liststarterkits', gulp.series( loadPatternlab, function ( done ) {
	patternlab.liststarterkits();
	done();
} ) );

gulp.task( 'patternlab:loadstarterkit', gulp.series( loadPatternlab, function ( done ) {
	patternlab.loadstarterkit( argv.kit, argv.clean );
	done();
} ) );

gulp.task( 'patternlab:installplugin', gulp.series( loadPatternlab, function ( done ) {
	patternlab.installplugin( argv.plugin );
	done();
} ) );


// watch task utility functions
function getSupportedTemplateExtensions() {
	var engines = require( './node_modules/patternlab-node/core/lib/pattern_engines' );
	return engines.getSupportedFileExtensions();
}

function getTemplateWatches() {
	return getSupportedTemplateExtensions().map( function ( dotExtension ) {
		return normalizePath( paths().source.patterns, '**', '*' + dotExtension );
	} );
}


/////
///// Copying files from the static front-end into their final destinations in the CMS
/////

function integrateJS() {
	var files = [],
		includingFiles = normalizeSrcs( config.filepaths.integrationSrc.js );

	if( config.generateMapsOnIntegration ) {
		includingFiles = includingFiles.concat( normalizeSrcs( config.filepaths.integrationSrc.jsSourceMaps ) );
	}

	return gulp.src( includingFiles, { allowEmpty: true } )
		// .pipe( cached( 'js-integrated', { optimizeMemory: true } ) )
		.pipe( gulp.dest( config.filepaths.integrationDest.js ) )
		.pipe( intercept( function( file ) {
			files.push( file.path );
			return file;
		} ) )
		.on( 'end', function() {
			var len = files.length;
			for( var i = 0; i < len; i++ ) {
				console.log( chalk.green( '✔ Integrated JS at ' + chalk.underline( files[i] ) ) );
			}

			if( len === 0 ) {
				console.log( chalk.yellow.bold( '✖ No new JS files to integrate' ) + chalk.yellow( '(' + chalk.underline( config.filepaths.integrationDest.js ) + ')' ) );
			}

			var cacheJson = JSON.stringify( cached.caches );
			fs.writeFileSync( CACHE_FILE, cacheJson );
		} );
}
gulp.task( 'integrate-js', gulp.series( setIntegrating, 'js-clean', integrateJS ) );

function integrateCSS() {
	var files = [],
		includingFiles = normalizeSrcs( config.filepaths.integrationSrc.css );

	if( config.generateMapsOnIntegration ) {
		includingFiles = includingFiles.concat( normalizeSrcs( config.filepaths.integrationSrc.cssSourceMaps ) );
	}

	return gulp.src( includingFiles, { allowEmpty: true } )
		// .pipe( cached( 'css-integrated', { optimizeMemory: true } ) )
		.pipe( gulp.dest( config.filepaths.integrationDest.css ) )
		.pipe( intercept( function( file ) {
			files.push( file.path );
			return file;
		} ) )
		.on( 'end', function() {
			var len = files.length;
			for( var i = 0; i < len; i++ ) {
				console.log( chalk.green( '✔ Integrated CSS at ' + chalk.underline( files[i] ) ) );
			}

			if( len === 0 ) {
				console.log( chalk.yellow.bold( '✖ No new CSS files to integrate' ) + chalk.yellow( '(' + chalk.underline( config.filepaths.integrationDest.css ) + ')' ) );
			}

			var cacheJson = JSON.stringify( cached.caches );
			fs.writeFileSync( CACHE_FILE, cacheJson );
		} );
}
gulp.task( 'integrate-css', gulp.series( setIntegrating, 'sass-clean', integrateCSS ) );

function integrateImages() {
	var files = [];

	return gulp.src( normalizeSrcs( config.filepaths.integrationSrc.images ), { allowEmpty: true } )
		.pipe( newer( config.filepaths.integrationDest.images ) )
		.pipe( gulp.dest( config.filepaths.integrationDest.images ) )
		.pipe( intercept( function( file ) {
			files.push( file.path );
			return file;
		} ) )
		.on( 'end', function() {
			var len = files.length;
			for( var i = 0; i < len; i++ ) {
				console.log( chalk.green( '✔ Integrated image at ' + chalk.underline( files[i] ) ) );
			}

			if( len === 0 ) {
				console.log( chalk.yellow.bold( '✖ No new image files to integrate' ) + chalk.yellow( '(' + chalk.underline( config.filepaths.integrationDest.images ) + ')' ) );
			}
		} );
}
gulp.task( 'integrate-images', gulp.series( setIntegrating, 'images', integrateImages ) );

function integrateFonts() {
	var files = [];

	return gulp.src( normalizeSrcs( config.filepaths.integrationSrc.fonts ), { allowEmpty: true } )
		.pipe( newer( config.filepaths.integrationDest.fonts ) )
		.pipe( gulp.dest( config.filepaths.integrationDest.fonts ) )
		.pipe( intercept( function( file ) {
			files.push( file.path );
			return file;
		} ) )
		.on( 'end', function() {
			var len = files.length;
			for( var i = 0; i < len; i++ ) {
				console.log( chalk.green( '✔ Integrated font at ' + chalk.underline( files[i] ) ) );
			}

			if( len === 0 ) {
				console.log( chalk.yellow.bold( '✖ No new font files to integrate' ) + chalk.yellow( '(' + chalk.underline( config.filepaths.integrationDest.fonts ) + ')' ) );
			}
		} );
}
gulp.task( 'integrate-fonts', gulp.series( setIntegrating, 'fonts', integrateFonts ) );

function integrateHTML() {
	var files = [];

	return gulp.src( normalizeSrcs( config.filepaths.integrationSrc.html ), { allowEmpty: true } )
		.pipe( newer( config.filepaths.integrationDest.html ) )
		.pipe( gulp.dest( config.filepaths.integrationDest.html ) )
		.pipe( intercept( function( file ) {
			files.push( file.path );
			return file;
		} ) )
		.on( 'end', function() {
			var len = files.length;
			for( var i = 0; i < len; i++ ) {
				console.log( chalk.green( '✔ Integrated html at ' + chalk.underline( files[i] ) ) );
			}

			if( len === 0 ) {
				console.log( chalk.yellow.bold( '✖ No new html files to integrate' ) + chalk.yellow( '(' + chalk.underline( config.filepaths.integrationDest.html ) + ')' ) );
			}
		} );
}
gulp.task( 'integrate-html', gulp.series( setIntegrating, 'json-data', loadPatternlab, build, integrateHTML ) );

var currRelease;
var currSprint;
var currIntegrationNum;
function getOldVersionNumber() {
	return gulp.src( config.filepaths.integrationDest.versionNumFile, { allowEmpty: true } )
		.pipe( intercept( function( file ) {
			var c = file.contents.toString().split( '.' );
			currRelease = parseInt( c[0], 10 );
			currSprint = parseInt( c[1], 10 );
			currIntegrationNum = parseInt( c[2], 10 );
		} ) );
}

async function setNewVersionNumber( done ) {
	var response = await prompts( [{
		type: 'number',
		name: 'release',
		message: 'Which release to production is this (0-indexed)?' + chalk.gray( ' (Previously set to ' + ( currRelease ? currRelease : 0 ) + ')' ),
		initial: currRelease || 0,
		format: val => {
			return parseInt( val, 10 );
		}
	},{
		type: 'number',
		name: 'sprint',
		message: 'In which sprint will this be integrated into the platform?' + chalk.gray( ' (Previously set to ' + ( currSprint ? currSprint : 0 ) + ')' ),
		initial: currSprint || 1,
		format: val => {
			return parseInt( val, 10 );
		}
	},{
		type: 'number',
		name: 'hotfix',
		message: 'How many integrations have you done for that sprint so far?' + chalk.gray( ' (Previously set to ' + ( currIntegrationNum ? currIntegrationNum : 0 ) + ')' ),
		initial: ( currIntegrationNum + 1 ) || 0,
		format: val => {
			return parseInt( val, 10 );
		}
	}] );

	if(
		typeof response.release == 'undefined'
		|| typeof response.sprint == 'undefined'
		|| typeof response.hotfix == 'undefined'
	) {
		console.log( chalk.red.bold( '\n\t✖ Did not adjust version number, not enough information' ) + '\n' );
		done();
		return;
	}

	var contents = response.release + '.' + response.sprint + '.' + response.hotfix + '-pl';

	var filePath = config.filepaths.integrationDest.versionNumFile.split( '/' );
	var fileName = filePath[filePath.length - 1];

	filePath.pop(); // Take off the filename
	filePath = filePath.join( '/' );

	return file( fileName, contents, { src: true } )
		.pipe( gulp.dest( filePath ) )
		.on( 'end', function() {
			console.log( '\n\t' + chalk.gray.bold( 'In Git, tag this integration commit with version: ' ) + chalk.gray( contents ) + '\n' );
		} );
}

gulp.task( 'integration-version', gulp.series( getOldVersionNumber, setNewVersionNumber ) );


gulp.task( 'integrate', gulp.series(
	gulp.parallel(
		'integrate-js',
		'integrate-css',
		'integrate-images',
		'integrate-fonts',
		'integrate-html'
	), 'integration-version'
) );


/////
///// Watchers, Main Build Tasks
/////

function watch() {
	const watchers = [
		{
			name: 'CSS',
			paths: normalizeSrcs( config.filepaths.stylesSrc ),
			config: { awaitWriteFinish: true },
			tasks: gulp.series( 'todos', 'sass' )
		}, {
			name: 'Images',
			paths: normalizeSrcs( config.filepaths.imagesSrc ),
			config: { awaitWriteFinish: true },
			tasks: gulp.series( 'images' )
		}, {
			name: 'Fonts',
			paths: normalizeSrcs( config.filepaths.fontsSrc ),
			config: { awaitWriteFinish: true },
			tasks: gulp.series( 'fonts' )
		}, {
			name: 'Styleguide Files',
			paths: [normalizePath( paths().source.styleguide, '**', '*' )],
			config: { awaitWriteFinish: true },
			tasks: gulp.series( 'pl-copy:styleguide', 'pl-copy:styleguide-css', reloadCSS )
		}, {
			name: 'Source Files',
			paths: [
				normalizePath( paths().source.patterns, '**', '*.json' ),
				normalizePath( paths().source.patterns, '**', '*.md' ),
				normalizePath( paths().source.data, 'data.json' ),
				normalizePath( paths().source.meta, '**', '*' ),
				normalizePath( paths().source.annotations, '**', '*' )
			].concat( getTemplateWatches() ),
			config: { awaitWriteFinish: true },
			tasks: gulp.series( build, reload, 'todos' )
		}, {
			name: 'Data JSON',
			paths: normalizeSrcs( config.filepaths.jsonSrc ),
			config: { awaitWriteFinish: true },
			tasks: gulp.series( 'json-data' )
		}, {
			name: 'Endpoints',
			paths: normalizeSrcs( config.filepaths.endpointsSrc ),
			config: { awaitWriteFinish: true },
			tasks: gulp.series( 'endpoints' )
		}
	];

	// Set up JS watchers
	if( config.filepaths.scriptsSrcInstructions ) {
		watchers.push( {
			name: 'JS',
			paths: normalizeSrcs( config.filepaths.scriptsSrcInstructions ).concat( normalizeSrcs( config.filepaths.scriptsSrc ) ),
			config: { awaitWriteFinish: true },
			tasks: gulp.series( 'js', reload, 'todos' )
		} );
	} else {
		watchers.push( {
			name: 'JS',
			paths: normalizeSrcs( config.filepaths.scriptsSrc ),
			config: { awaitWriteFinish: true },
			tasks: gulp.series( 'js', reload, 'todos' )
		} );
	}

	watchers.forEach( watcher => {
		// console.log( '\n' + chalk.bold( 'Watching ' + watcher.name + ':' ) );
		// watcher.paths.forEach(p => console.log( '  ' + p) );
		gulp.watch( watcher.paths, watcher.config, watcher.tasks );
	} );
}

gulp.task( 'connect', gulp.series( function ( done ) {
	var defaultOptions = {
		server: {
			baseDir: normalizePath( paths().public.root )
		},
		snippetOptions: {
			// Ignore all HTML files within the templates folder
			blacklist: ['/index.html', '/', '/?*']
		},
		notify: {
			styles: [
				'display: none',
				'padding: 15px',
				'font-family: sans-serif',
				'position: fixed',
				'font-size: 1em',
				'z-index: 9999',
				'bottom: 0px',
				'right: 0px',
				'border-top-left-radius: 5px',
				'background-color: #1B2032',
				'opacity: 0.4',
				'margin: 0',
				'color: white',
				'text-align: center'
			]
		}
	};

	// server option is for a browsersync hosted server, vs proxy is for another one (like Flywheel)
	if( config.browsersync && config.browsersync.proxy ) {
		console.log( chalk.yellow( 'Proxying an '+ chalk.bold( 'existing' ) + ' v-host' ) + chalk.gray( '(' + config.browsersync.proxy + ')' ) );
		config.browsersync.server = false;
	}

	browserSync.init( {...defaultOptions, ...config.browsersync}, function () {
		done();
	} );
} ) );

gulp.task( 'assets', gulp.series(
	setDebugging,
	gulp.parallel(
		'sass',
		'js',
		'images',
		'fonts',
		'endpoints',
		gulp.series(
			'pl-copy:styleguide',
			'pl-copy:styleguide-css'
		)
	)
) );

gulp.task( 'assets-clean', gulp.series(
	setClean,
	gulp.parallel(
		'sass-clean',
		'js-clean',
		'images',
		'fonts',
		'endpoints',
		gulp.series(
			'pl-copy:styleguide',
			'pl-copy:styleguide-css'
		)
	)
) );

gulp.task( 'build', gulp.series( gulp.parallel( 'assets', 'json-data' ), gulp.series( loadPatternlab, build ) ) );
gulp.task( 'build-clean', gulp.series( gulp.parallel( 'assets-clean', 'json-data' ), gulp.series( loadPatternlab, build ) ) );

gulp.task( 'serve', gulp.series( 'build', 'connect', 'todos', watch ) );
gulp.task( 'default', gulp.series( 'serve' ) );

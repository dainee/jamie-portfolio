/* global objectFitImages */
( function() {

	var selectors = [
		'.example img' // TODO: update this to the classes/selectors that need a polyfill
	];

	objectFitImages( selectors.join( ',' ) );

} )();

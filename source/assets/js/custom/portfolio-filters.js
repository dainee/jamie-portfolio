( function( $ ) {
	$( document ).ready( function() {
		var filterAll = $( '.portfolio-filters__filter-all' );
		var filterOne = $( '.portfolio-filters__filter-one' );
		var filterTwo = $( '.portfolio-filters__filter-two' );
		var imageOne = $( '.portfolio-filters__image-one' );
		var imageTwo = $( '.portfolio-filters__image-two' );

		// Show all
		filterAll.on( 'click', function() {
			imageOne.show( 'slow' );
			imageTwo.show( 'slow' );
		} );

		// Show UI/UX portfolio
		filterOne.on( 'click', function() {
			imageOne.show( 'slow' );
			imageTwo.hide( 'slow' );
		} );

		// Show others
		filterTwo.on( 'click', function() {
			imageOne.hide( 'slow' );
			imageTwo.show( 'slow' );
		} );
	} );
} )( jQuery );
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
			filterAll.addClass( 'active' );
			filterOne.removeClass( 'active' );
			filterTwo.removeClass( 'active' );
		} );

		// Show UI/UX portfolio
		filterOne.on( 'click', function() {
			imageOne.show( 'slow' );
			imageTwo.hide( 'slow' );
			filterAll.removeClass( 'active' );
			filterOne.addClass( 'active' );
			filterTwo.removeClass( 'active' );
		} );

		// Show others
		filterTwo.on( 'click', function() {
			imageOne.hide( 'slow' );
			imageTwo.show( 'slow' );
			filterAll.removeClass( 'active' );
			filterOne.removeClass( 'active' );
			filterTwo.addClass( 'active' );
		} );
	} );
} )( jQuery );
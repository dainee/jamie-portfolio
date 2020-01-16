( function( $ ) {
	$( document ).ready( function() {
		var filter = $( '.portfolio-filters__filter' );
		var filterAll = $( '.portfolio-filters__filter-all' );
		var filterOne = $( '.portfolio-filters__filter-one' );
		var filterTwo = $( '.portfolio-filters__filter-two' );
		var imageAll = $( '.portfolio-filters__image' );
		var imageOne = $( '.portfolio-filters__image-one' );
		var imageTwo = $( '.portfolio-filters__image-two' );

		// Show all
		filterAll.on( 'click', function() {
			var $this = $( this );
			filter.removeClass( 'active' );
			$this.addClass( 'active' );
			imageAll.removeClass( 'hide' );
		} );

		// Show UI/UX portfolio
		filterOne.on( 'click', function() {
			var $this = $( this );
			filter.removeClass( 'active' );
			$this.addClass( 'active' );
			imageOne.removeClass( 'hide' );
			imageTwo.addClass( 'hide' );
		} );

		// Show others
		filterTwo.on( 'click', function() {
			var $this = $( this );
			filter.removeClass( 'active' );
			$this.addClass( 'active' );
			imageTwo.removeClass( 'hide' );
			imageOne.addClass( 'hide' );
		} );
	} );
} )( jQuery );
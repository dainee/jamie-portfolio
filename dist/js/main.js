// TODO: Remove this file, it's just an example
console.log( 'this is test1.js' ); // eslint-disable-line no-console

( function() {
	var $ajaxForm;
	var $loader;
	var $result;

	$( document ).ready( function() {

		$ajaxForm = $( '.js-test' );
		$loader = $ajaxForm.find( '.js-test-loading' );
		$result = $ajaxForm.find( '.js-test-result' );

		$ajaxForm.on( 'submit.test1', formSubmit );

	} );

	function formSubmit( e ) {
		e.preventDefault(); // Do not submit the form, this code will handle it

		var url = $( this ).attr( 'action' );
		var method = $( this ).attr( 'method' );
		var data = $( this ).serialize();

		$( this ).find( $loader ).show();

		$.ajax( url, {
			data: data,
			type: method,
			context: $( this ),
			success: handleSuccessResponse,
			error: handleErrorResponse,
			complete: handleComplete
		} );
	}

	function handleSuccessResponse( response ) {

		if( response.success ) {
			var $r = $( this ).find( $result );
			$r.find( '.js-test-result-success' ).show();
			$r.find( '.js-test-result-error' ).hide();
			$r.show();
		} else {
			handleErrorResponse.apply( this );
		}
	}

	function handleErrorResponse() {
		var $r = $( this ).find( $result );
		$r.find( '.js-test-result-success' ).hide();
		$r.find( '.js-test-result-error' ).show();
		$r.show();

		console.error( arguments ); // eslint-disable-line no-console
	}

	function handleComplete() {
		$( this ).find( $loader ).hide();
	}

} )();
// TODO: Remove this file, it's just an example
console.log( 'this is vendor.js' );
//# sourceMappingURL=main.js.map

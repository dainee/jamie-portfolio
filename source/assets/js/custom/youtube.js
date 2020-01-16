/* global YT */

( function( $ ) {

	// VIDEO FEATURED
	// -----------------------------------------------
	// Toggles placing video poster overlays over 
	// YouTube Video Player iframes on homepage.
	// Stops/Starts videos.

	// Loads the IFrame Player API code asynchronously.

	var tag = document.createElement( 'script' );
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName( 'script' )[ 0 ];
	firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );
	const SELECTOR_IFRAME = ".youtube__video iframe"
	const CLASS_ARTICLE = "youtube__featured";
	const CLASS_POSTER = "youtube__video-poster";
	const CLASS_PLAYING = "youtube__video--playing";

	window.onYouTubeIframeAPIReady = function() {
		$( SELECTOR_IFRAME ).each( function() {
			new YT.Player( $( this ).attr( 'id' ), {
				events: {
					'onReady': onPlayerReady,
					'onStateChange': onPlayerStateChange
				}
			});

			// Prevent tabindex when not playing
			$( this ).attr( 'tabindex', '-1' );
		});
	};

	function onPlayerReady( event ) {
		var $iframe = $( event.target.getIframe() );
		var $article = $iframe.closest( '.' + CLASS_ARTICLE );
		var $poster = $article.find( '.' + CLASS_POSTER );

		$poster.on( 'click.youtube', function() {
			event.target.playVideo();
		});
	}

	function onPlayerStateChange( event ) {
		var $iframe = $( event.target.getIframe() );
		var $article = $iframe.closest( '.' + CLASS_ARTICLE );
		var $poster = $article.find( '.' + CLASS_POSTER );

		switch ( event.data ) {
			case YT.PlayerState.UNSTARTED:
			case YT.PlayerState.BUFFERING:
			case YT.PlayerState.PLAYING:

				$iframe.attr( 'tabindex', 0 ).focus(); // apply focus when video is playing
				$article.addClass( CLASS_PLAYING );
			break;

			case YT.PlayerState.PAUSED:
			case YT.PlayerState.ENDED:

				$iframe.attr( 'tabindex', '-1' );
				$article.removeClass( CLASS_PLAYING );

				setTimeout( function() {
					$poster.focus(); // apply focus back to poster when video is paused/ended
				}, 100);
			break;
		}
	}

} )( jQuery );

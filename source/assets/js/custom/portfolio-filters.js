( function( $ ) {
	$( document ).ready( function() {
// Want to show a particular category on page load (not all the images)? Add this code to the top of the javascript file


// Hide all the images
// $('.all').addClass('hide');

// Show only the landscape category. Change to the category you want to show on page load
// $('.landscape').removeClass('hide');

// Remove active class from all filter buttons
// $('.filter').removeClass('active');

// Apply active class to the filter button matching the filter you want to be shown on page load
// $('.filter-landscape').addClass('active');


//---------------------------------------------------------
//---------------------------------------------------------


// Show all
$('.filter-all').on('click', function() {
  var $this = $(this);
  $('.filter').removeClass('active');
  $this.addClass('active');
  $('.all').removeClass('hide');
});

// Show landscape
$('.filter-landscape').on('click', function() {
  var $this = $(this);
  $('.filter').removeClass('active');
  $this.addClass('active');
  $('.landscape').removeClass('hide');
  $('.urban, .portrait').addClass('hide');
});

// Show urban
$('.filter-urban').on('click', function() {
  var $this = $(this);
  $('.filter').removeClass('active');
  $this.addClass('active');
  $('.urban').removeClass('hide');
  $('.portrait, .landscape').addClass('hide');
});

// Show portrait
$('.filter-portrait').on('click', function() {
  var $this = $(this);
  $('.filter').removeClass('active');
  $this.addClass('active');
  $('.portrait').removeClass('hide');
  $('.landscape, .urban').addClass('hide');
});


	} );
} )( jQuery );
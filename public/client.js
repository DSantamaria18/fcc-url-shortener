// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html


$('.btn-shorten').on('click',async function(){
  // AJAX call to /api/shorten with the URL that the user entered in the input box
  console.log("Shortening " + $('#url-field').val());
  var uri = '/new/' + $('#url-field').val();
  $.ajax({
    url: uri,
    type: 'GET',
    dataType: 'JSON',
    //data: {url: $('#url-field').val()},
    success: await function(data){
        // display the shortened URL to the user that is returned by the server
        var resultHTML = '<a class="result" href="' + data.short_url + '">'
            + data.short_url + '</a>';
        console.log(resultHTML);
        $('#link').html(resultHTML);
        $('#link').hide().fadeIn('slow');
    }
  });
});

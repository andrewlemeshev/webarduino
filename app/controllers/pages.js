exports.home = function (req, res) {
  res.render('pages/home', {
      title: 'Home page',
      message: __dirname
  })
}

exports.about = function (req, res) {
  res.render('pages/about', {
    title: 'About WebArduino',
    message: 'Simple to understand web arduino maker. It has been writen on JavaScript, using JSGL for the representing and NodeJS as server technology.'
  })
}

exports.err404 = function (req, res) {
  res.render('pages/404', {
    title: 'Page not found',
    message: 'Please recheck the url you wrote or use the buttons above'
  })
}

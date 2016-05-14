exports.home = function (req, res) {
  res.render('pages/home', {
      title: 'Home page',
      message: 'This is the "home" action of "pages" controller'
  })
}

exports.about = function (req, res) {
  res.render('pages/about', {
    title: 'About WebArduino',
    message: 'Simple to understand web arduino maker. It has been writen on JavaScript, using JSGL for the representing and NodeJS as server technology.'
  })
}

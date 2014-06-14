var fs = require('fs')
  , url = require('url')
  , http = require('http')
  , io = require('socket.io');

var controller = require('./controller');

var port = Number(process.env.PORT || 5678);

var app = http.createServer(function (req, res) {
  var path = (url.parse(req.url).pathname == '/') 
    ? '/view/index.html' 
    : url.parse(req.url).pathname;
  var mime = path.split('.').pop();
  if (mime == 'js') {
    mime = 'text/javascript';
  } else if (mime == 'jpg' || mime == 'png') {
    mime = 'image/' + mime;
  } else {
    mime = 'text/' + mime;
  }
  fs.readFile('.' + path, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end();
    } else {
      res.writeHead(200, {"Content-Type": mime});
      res.end(data);
    }
  });
}).listen(port);

io.listen(app).sockets.on('connection', function (socket) {


  controller.connect_handler(socket);

  socket.on('disconnect', function() {
    controller.disconnect_handler(socket);
  });

  socket.on('new_room', function (data) {
    var code = controller.new_room(data);
    socket.emit('new_room_result', code);
  });

  socket.on('join_room', function (data) {
    var code = controller.join_room(data);
    socket.emit('join_room_result', code);
    controller.save_room(this, data);
  });

  socket.on('guess_number', function (data) {
    controller.guess_number(data);
  });

});
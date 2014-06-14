var rooms = [];
var players = [];

exports.connect_handler = function (socket) {
  players.push(socket);
}

exports.disconnect_handler = function (socket) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].id == socket.id) {
      delete_player(players[i]);
      players.splice(i, 1);
      return false;
    }
  }
}

exports.new_room = function (data) {
  var info = JSON.parse(data);
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].name == info.name) {
      return 1;
    }
  }
  var room = {
    free : true,
    name : info.name,
    number : info.number,
    target : 20 * (info.number / 2) + Math.round(Math.random() * 10),
    round : 0,
    members : [],
    red : 0,
    blue : 0,
    redSum : 0,
    blueSum : 0,
    guessNum : 0
  }
  rooms.push(room);
  return 0;
}

exports.join_room = function (data) {
  var info = JSON.parse(data);
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].name == info.roomName) {
      if (rooms[i].free) {
        if (info.team == 'blue') {
          if (rooms[i].blue >= rooms[i].number / 2) {
            return 3;
          } else {
            rooms[i].blue++;
          }
        } else if (info.team == 'red') {
          if (rooms[i].red >= rooms[i].number / 2) {
            return 3;
          } else {
            rooms[i].red++;
          }
        }
        rooms[i].members.push({
          name : info.userName,
          id : info.userId,
          team : info.team,
          guess : 0
        });
        exports.room_msg(rooms[i].name, 'room_update', JSON.stringify(rooms[i]));
        exports.room_msg(rooms[i].name, 'one_join', info.userName);
        if (rooms[i].members.length == rooms[i].number) {
          rooms[i].free = false;
          setTimeout(function () {
            start_game(rooms[i]);
          });
        }
        return 0;
      } else {
        return 1;
      }
    }
  }
  return 2;
}

exports.save_room = function (socket, room) {
  var info = JSON.parse(room);
  socket.roomName = info.roomName;
  socket.team = info.team;
  socket.playerName = info.userName;
}

exports.guess_number = function (data) {
  var info = JSON.parse(data);
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].name == info.roomName) {
      setTimeout(function () {
        guess_handler(rooms[i], info);
      });
      break;
    }
  }
  exports.room_msg(info.roomName, 'one_guess', data);
}

exports.room_msg = function (name, evt, msg) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].name == name) {
      var members = rooms[i].members;
      for (var j = 0; j < members.length; j++) {
        exports.player_msg(members[j].id, evt, msg);
      }
    }
  }
}

exports.player_msg = function (id, evt, msg) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].id == id) {
      players[i].emit(evt, msg);
    }
  }
}

function start_game (room) {
  room.round++;
  exports.room_msg(room.name, 'game_start', JSON.stringify(room));
}

function guess_handler (room, guess) {
  if (guess.team == 'red') {
    room.redSum += guess.number;
  } else if (guess.team == 'blue') {
    room.blueSum += guess.number;
  }
  room.guessNum++;
  if (room.guessNum == room.number) {
    round_handler(room);
  }
}

function round_handler (room) {
  room.round++;
  if (room.round > 3) {
    exports.room_msg(room.name, 'game_end', JSON.stringify(room));
    delete_room(room.name);
    return false;
  }
  if (room.redSum >= room.target || room.blueSum >= room.target) {
    exports.room_msg(room.name, 'game_end', JSON.stringify(room));
    delete_room(room.name);
  } else {
    exports.room_msg(room.name, 'round_end', JSON.stringify(room));
    room.guessNum = 0;
    room.redSum = 0;
    room.blueSum = 0;
  }
}

function delete_player (player) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].name == player.roomName) {
      if (rooms[i].round > 0) {
        exports.room_msg(rooms[i].name, 'game_abort');
        rooms.splice(i, 1);
        return false;
      } else {
        rooms[i].free = true;
        if (player.team == 'red') {
          rooms[i].red--;
        } else if (player.team == 'blue') {
          rooms[i].blue--;
        }
        var members = rooms[i].members;
        for (var j = 0; j < members.length; j++) {
          if (members[j].id == player.id) {
            exports.room_msg(rooms[i].name, 'one_leave', player.playerName);
            members.splice(j, 1);
            exports.room_msg(rooms[i].name, 'room_update', JSON.stringify(rooms[i]));
            return false;
          }
        }
      }
      return false;
    }
  }
}

function delete_room (name) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].name == name) {
      rooms.splice(i, 1);
      return false;
    }
  }
}
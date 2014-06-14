var Client = (function () {

  var socket = io.connect();
  var _sessionid, _username, _roomname, _team, _round;

  _username = '某人';

  socket.on('connect', function () {
    _sessionid = socket.socket.sessionid;
  });

  socket.on('new_room_result', function (data) {
    if (data == 0) {
      newRoomCallback();
    } else {
      if (data == 1) {
        alert('这个房间已经被创建了！');
      }
    }
  });

  socket.on('join_room_result', function (data) {
    if (data == 0) {
      joinRoomCallback();
    } else {
      if (data == 1) {
        alert('这个房间已经满了！');
        document.getElementById('choose-side').style.display = 'none';
        document.getElementById('join-form').style.display = 'block';
      } else if (data == 2) {
        alert('找不到这个房间！');
        document.getElementById('choose-side').style.display = 'none';
        document.getElementById('join-form').style.display = 'block';
      } else if (data == 3) {
        alert('这个队已经满了！');
      }
    }
  });

  socket.on('room_update', function (data) {
    roomUpdate(data);
  });

  socket.on('one_join', function (data) {
    oneJoinHandler(data);
  });

  socket.on('one_leave', function (data) {
    oneLeaveHandler(data);
  });

  socket.on('game_start', function (data) {
    var stat = JSON.parse(data);
    startGame(data);
  });

  socket.on('game_abort', function () {
    alert('有人离开了，游戏被终止了！');
    window.onbeforeunload = null;
    location.reload();
  });

  socket.on('one_guess', function (data) {
    oneGuessHandler(data);
  });

  socket.on('round_end', function (data) {
    roundHandler(data);
  });

  socket.on('game_end', function (data) {
    window.onbeforeunload = null;
    gameHandler(data);
  });

  function domEventHandler() {
    var newBtn = document.getElementById('new');
    newBtn.onclick = newRoom;
    var joinBtn = document.getElementById('join');
    joinBtn.onclick = joinRoom;
    var newSubmit = document.getElementById('new-submit');
    newSubmit.onclick = submitRoom;
    var joinSubmit = document.getElementById('join-submit');
    joinSubmit.onclick = newRoomCallback;
    var joinBack = document.getElementById('join-back');
    joinBack.onclick = goBack;
    var newBack = document.getElementById('new-back');
    newBack.onclick = goBack;
    var redBtn = document.getElementById('red');
    redBtn.onclick = chooseSide;
    var blueBtn = document.getElementById('blue');
    blueBtn.onclick = chooseSide;
    var gameSubmit = document.getElementById('guess-submit');
    gameSubmit.onclick = guessNumber;
  }

  function newRoom () {
    document.getElementById('new-form').style.display = 'block';
    document.getElementById('start-screen').style.display = 'none';
  }

  function submitRoom () {
    var roomName = document.getElementById('new-id').value;
    var roomNum = document.getElementById('new-number').value;
    if (roomName != '') {
      var room = {
        name : roomName,
        number : parseInt(roomNum)
      }
      _roomname = roomName;
      socket.emit('new_room', JSON.stringify(room));
    }
  }

  function newRoomCallback () {
    document.getElementById('choose-side').style.display = 'block';
    document.getElementById('new-form').style.display = 'none';
  }

  function joinRoom () {
    document.getElementById('join-form').style.display = 'block';
    document.getElementById('start-screen').style.display = 'none';
  }

  function goBack () {
    document.getElementById('new-form').style.display = 'none';
    document.getElementById('join-form').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
  }

  function chooseSide (e) {
    var roomName;
    var playerName = document.getElementById('name').value;
    var value = document.getElementById('new-id').value;
    if (value != '') {
      roomName = value;
    } else {
      roomName = document.getElementById('join-id').value;
    }
    if (playerName != '') {
      _username = playerName;
    }
    var team = e.target.id;
    var player = {
      roomName : roomName,
      userName : _username,
      userId : _sessionid,
      team : team
    }
    _roomname =  roomName;
    _team = team;
    socket.emit('join_room', JSON.stringify(player));
  }

  function joinRoomCallback () {
    document.getElementById('game').style.display = 'block';
    document.getElementById('choose-side').style.display = 'none';
    if (_team == 'red') {
      document.getElementById('avatar').setAttribute('src', '../asset/img/red-head.png');
    } else if (_team == 'blue') {
      document.getElementById('avatar').setAttribute('src', '../asset/img/blue-head.png');
    }
  }

  function roomUpdate (data) {
    var info = JSON.parse(data);
    var redNum = document.getElementById('red-num');
    var blueNum = document.getElementById('blue-num');
    redNum.innerHTML = info.red;
    blueNum.innerHTML = info.blue;
  }

  function oneJoinHandler (data) {
    document.getElementById('result').innerHTML = data + ' 加入了房间。';
  }

  function oneLeaveHandler (data) {
    document.getElementById('result').innerHTML = data + ' 离开了房间。';
  }

  function startGame (data) {
    var info = JSON.parse(data);
    _round = info.round;
    document.getElementById('result').innerHTML = '游戏开始！';
    document.getElementById('guess-submit').removeAttribute('disabled');
    window.onbeforeunload = function () {
      return "现在离开整个游戏将强行结束，你确定吗？";
    }
  }

  function guessNumber () {
    var guessNum = parseInt(document.getElementById('guess').value);
    if (guessNum >= 0 && guessNum <= 999) {
      var guess = {
        roomName : _roomname,
        userId : _sessionid,
        userName : _username,
        team : _team,
        number : parseInt(guessNum)
      }
      socket.emit('guess_number', JSON.stringify(guess));
      document.getElementById('guess-submit').setAttribute('disabled', true);
      if (_round == 1) {
        document.getElementById('round-one').innerHTML = guessNum;
      } else if (_round == 2) {
        document.getElementById('round-two').innerHTML = guessNum;
      } else {
        document.getElementById('round-three').innerHTML = guessNum;
      }
    }
  }

  function oneGuessHandler (data) {
    var info = JSON.parse(data);
    document.getElementById('result').innerHTML = info.userName + ' 猜了一个数字。';
  }

  function roundHandler (data) {
    var info = JSON.parse(data);
    var result = document.getElementById('result');
    var winner = judge(info.redSum, info.blueSum);
    result.innerHTML = '第 ' + (info.round - 1) + ' 轮：';
    _round = info.round;
    if (winner == 'both') {
      result.innerHTML += '打平！';
    } else {
      result.innerHTML += (winner == _team) ? '你们正在领先！' : '你们现在落后。。';
    }
    document.getElementById('guess-submit').removeAttribute('disabled');
  }

  function gameHandler (data) {
    var info = JSON.parse(data);
    var result = '';
    if (info.redSum > info.target || info.blueSum > info.target) {
      if (info.redSum > info.target && _team == 'red') {
        alert('!!! BOOM !!!');
        location.reload();
        return false;
      }
      if (info.blueSum > info.target && _team == 'blue') {
        alert('!!! BOOM !!! \n\n正确数字是：' + info.target + '\n\n');
        location.reload();
        return false;
      }
      alert('另一队 BOOM 了，你们赢了！ \n\n正确数字是：' + info.target + '\n\n');
      location.reload();
      return false;
    } else {
      var winner = judge(info.redSum, info.blueSum);
      if (winner == 'both') {
        alert('平手!');
      } else {
        var result = (winner == _team) ? '你们赢了！' : '你们输了。。';
        result += '\n\n正确数字是： ' + info.target + '\n\n';
        alert(result);
      }
    }
    location.reload();
  }

  function judge (red, blue) {
    var winner = 'both';
    if (red > blue) {
      winner = 'red';
    } else if (red < blue) {
      winner = 'blue';
    }
    return winner;
  }

  window.onload = function () {
    domEventHandler();
  }

  return {

  };

})();
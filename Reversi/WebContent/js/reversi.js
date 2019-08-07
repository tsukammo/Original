// ref:https://github.com/ke1suke/othello

// define constant value
var BOARD_SIZE = {
	'WIDTH' : 6,
	'HEIGHT' : 6,
};

var BLOCK_KIND = {
	'NONE' : 0,
	'BLACK' : 1,
	'WHITE' : 2,
	'MAX' : 3,
};

var SQUARE_SIZE = {
	'WIDTH' : 31,
	'HEIGHT' : 31,
};

var SLEEP_KIND = {
	'TURNOVER' : 1000,
};

var sleepTime = 30;

var root;
var optRoot;
var bandit;
var stop;
var player;
var end;
var nowNode;
var optNowNode;
var modeVS;
var noSturdy;
var vsTotal;
var vsWin;
var optColor;
var stone;
var board = [];
var player_color;

var rec = "";
var records = [];

var black = 0;
var white = 0;

var dx = [1,0,1,1];
var dy = [0,1,1,-1];

var getCountIsPossibleToTurnOver = function(x, y, dx, dy, _board, _player_color) {

	var count = 0;
	var cx = x + dx;
	var cy = y + dy;

	if (cx < 0 || BOARD_SIZE.WIDTH <= cx || cy < 0 || BOARD_SIZE.HEIGHT <= cy) {
		return 0;
	}
	while (_board[cx][cy] == BLOCK_KIND.MAX - _player_color) {
		count++;
		cx += dx;
		cy += dy;

		if ((cx < 0 || BOARD_SIZE.WIDTH < cx)
				|| (cy < 0 || BOARD_SIZE.HEIGHT < cy)) {

			return 0;
		}
	}

	if (count > 0 && _board[cx][cy] == _player_color) {
		return count;
	}

	return 0;
};

var turnOverStraight = function(x, y, dx, dy, _board, _player_color) {

	var cx = x + dx;
	var cy = y + dy;

	while (_board[cx][cy] == BLOCK_KIND.MAX - _player_color) {
		_board[cx][cy] = _player_color;
		cx += dx;
		cy += dy;
	}
};

var turnOverBlock = function(x, y, flip, _board, _player_color) {
	if(end){
		return;
	}
	var total = 0;

	// can not put block
	if (_board[x][y] != BLOCK_KIND.NONE) {
		return total;
	}

	// check for 8 direction whether it is possible to turn over block
	for (var dx = -1; dx <= 1; dx++) {
		for (var dy = -1; dy <= 1; dy++) {

			if (dx == 0 && dy == 0) {
				continue;
			}

			var cnt = getCountIsPossibleToTurnOver(x, y, dx, dy, _board,
					_player_color);
			if (cnt > 0) {
				total += cnt;
				if (flip) {
					turnOverStraight(x, y, dx, dy, _board, _player_color);
				}
			}
		}
	}

	return total;
};

var showBoard = function() {

	var b = document.getElementById("board");

	while (b.firstChild) {
		b.removeChild(b.firstChild);
	}

	for (var y = 0; y < BOARD_SIZE.HEIGHT; y++) {
		for (var x = 0; x < BOARD_SIZE.WIDTH; x++) {
			var square = stone[board[x][y]].cloneNode(true);

			square.style.left = ((x) * SQUARE_SIZE.WIDTH) + "px";
			square.style.top = ((y) * SQUARE_SIZE.HEIGHT) + "px";
			b.appendChild(square);

			(function() {
				var _x = x;
				var _y = y;
				square.onclick = function() {
					if (nowNode == null) {
						return;
					}
					if (turnOverBlock(_x, _y, true, board, player_color) > 0) {
						setBoard(_x, _y, player_color);
						var _next = false;
						for (var cn = 0; cn < nowNode.childNodes.length; cn++) {
							var child = nowNode.childNodes[cn];
							if (child.move == "" + _x + _y) {
								nowNode = child;
								if (child.childNodes == null) {
									nowNode.expandChild();
								}
								_next = true;
								break;
							}
						}
						if (!changePlayer(board, player_color)) {
							player_color = BLOCK_KIND.MAX - player_color;
						}
						showBoard();
						setTimeout(selfSturdy, 10);
					}
				};
			})();
		}
	}

	showProgress();
};

var setBoard = function(x, y, _player_color) {

	rec = rec + x + y;
	console.log(rec);
	board[x][y] = _player_color;
}
var showProgress = function() {

	black = 0;
	white = 0;

	for (var y = 0; y < BOARD_SIZE.HEIGHT; y++) {
		for (var x = 0; x < BOARD_SIZE.WIDTH; x++) {
			if (board[x][y] == BLOCK_KIND.BLACK) {
				black++;
			} else if (board[x][y] == BLOCK_KIND.WHITE) {
				white++;
			} else {
				// no opereation
			}
		}
	}

	var msg = document.getElementById("msgBlack");

	msg.innerHTML = "    " + black;

	var msg2 = document.getElementById("msgWhite");

	msg2.innerHTML = "    " + white;

	// output result
	var blob = new Blob([ records ], {
		"type" : "text/plain"
	});
	window.URL = window.webkitURL || window.URL;
	$("#download").attr("href", window.URL.createObjectURL(blob));
	// power
	if (HTMLCanvasElement) {
		var cv = document.querySelector('#cv');
		var c = cv.getContext('2d');
		c.clearRect(0, 0, 300, 200);
		c.fillStyle = 'rgb(0, 0, 0)';
		var _w = 0.5;
		if (nowNode && !stop) {
			_w = nowNode.wins / nowNode.visits;
		}

		console.log(_w);
		c.fillRect(0, 0, _w * 300, 200);
		c.fillStyle = 'rgb(255, 0, 0)';
		c.fillRect(149, 0, 3, 200);
	}
};

var effectDamage = function(win) {
	if(!modeVS){
		return;
	}
	if(BLOCK_KIND.WHITE - optColor != win){
		$('#myEff').removeClass('damage');
		$('#myEff')[0].offsetWidth = $('#opEff')[0].offsetWidth;
		$('#myEff').addClass('damage');
	}else{
		$('#opEff').removeClass('damage');
		$('#opEff')[0].offsetWidth = $('#opEff')[0].offsetWidth;
		$('#opEff').addClass('damage');
	}
}
var changePlayer = function(_board, _player_color) {

	var pass = false;

	_player_color = BLOCK_KIND.MAX - _player_color;

	if (isPass(_board, _player_color)) {
		if (player_color == BLOCK_KIND.BLACK) {
			rec = rec + "--";
			console.log(rec);
			nowNode = nowNode.childNodes[0];
			if (nowNode.childNodes == null) {
				nowNode.expandChild();
			}
			if(modeVS){
				optNowNode = optNowNode.childNodes[0];
				if (optNowNode.childNodes == null) {
					optNowNode.expandChild();
				}
			}
			console.log("pass");
			if (isPass(nowNode.board, BLOCK_KIND.MAX - _player_color)) {
				end = true;
				console.log("game set!");
				if (player == 0) {
					if (black == white) {
						OnClickButton(0.5);
					} else if (black > white) {
						OnClickButton(1);
						effectDamage(1);
					} else {
						OnClickButton(0);
						effectDamage(0);
					}
				}
				
			}
		} else if (player_color == BLOCK_KIND.WHITE) {
			rec = rec + "--";
			console.log(rec);
			nowNode = nowNode.childNodes[0];
			if (nowNode.childNodes == null) {
				nowNode.expandChild();
			}
			if(modeVS){
				optNowNode = optNowNode.childNodes[0];
				if (optNowNode.childNodes == null) {
					optNowNode.expandChild();
				}
			}
			console.log("pass");
			if (isPass(nowNode.board, BLOCK_KIND.MAX - _player_color)) {
				end = true;
				console.log("game set!");
				if (player == 0) {
					if (black == white) {
						OnClickButton(0.5);
					} else if (black > white) {
						OnClickButton(1);
						effectDamage(1);
					} else {
						OnClickButton(0);
						effectDamage(0);
					}
				}
			}
		} else {
			alert("invalid status");
		}

		_player_color = BLOCK_KIND.MAX - _player_color;

		pass = true;
	}

	return pass;
};

var isPass = function(_board, _player_color) {

	for (var y = 0; y < BOARD_SIZE.HEIGHT; y++) {
		for (var x = 0; x < BOARD_SIZE.WIDTH; x++) {

			if (turnOverBlock(x, y, false, _board, _player_color) > 0) {
				return false;
			}
		}
	}

	return true;
};

var initBoard = function() {
	end = false;
	rec = "";
	player_color = BLOCK_KIND.BLACK;

	// 0:none, 1:black, 2:white
	stone = [ document.getElementById("none"),
			document.getElementById("black"), document.getElementById("white") ];

	// clear
	for (var i = 0; i < BOARD_SIZE.HEIGHT + 1; i++) {
		board[i] = [];
		for (var j = 0; j < BOARD_SIZE.WIDTH + 1; j++) {
			board[i][j] = BLOCK_KIND.NONE;
		}
	}

	// initial position
	board[2][3] = BLOCK_KIND.BLACK;
	board[3][2] = BLOCK_KIND.BLACK;
	board[2][2] = BLOCK_KIND.WHITE;
	board[3][3] = BLOCK_KIND.WHITE;

	nowNode = root;
	if(optRoot){
		optNowNode = optRoot;
	}

};

onload = function() {
	// just in case
	Object.freeze(BLOCK_KIND);
	Object.freeze(BOARD_SIZE);
	Object.freeze(SQUARE_SIZE);

	// initialize board
	initBoard();
	// start game
	showBoard();
};

var outField = function(x,y) {
	if(x<0||x>=BOARD_SIZE.WIDTH||y<0||y>=BOARD_SIZE.HEIGHT){
		return true;
	}
	return false;
}
// MCTS
function Node(board, parentNode, move, player_color) {
	// board
	var _concBlack = 0;
	var _concWhite = 0;
	var _board = [];
	var _conc = [];
	for (var i = 0; i < BOARD_SIZE.HEIGHT + 1; i++) {
		_board[i] = [];
		_conc[i] = [];
		for (var j = 0; j < BOARD_SIZE.WIDTH + 1; j++) {
			var tmp = board[i][j];
			_board[i][j] = tmp;
			_conc[i][j] = false;
		}
	}
	// count concrete stone
	var _change = true;
	while(_change){
		_change = false;
	for (var i = 0; i < BOARD_SIZE.HEIGHT; i++) {
		for (var j = 0; j < BOARD_SIZE.WIDTH; j++) {
			if(_board[i][j]==0||_conc[i][j]){
				continue;
			}
			var _cf = true;
			for (var d = 0; d < 4; d++) {
				var _x = i + dx[d];
				var _y = j + dy[d];
				if(outField(_x,_y) || (_conc[_x][_y] && _board[_x][_y]==_board[i][j])){
					continue;
				}
				var _x2 = i - dx[d];
				var _y2 = j - dy[d];
				if(outField(_x2,_y2) || (_conc[_x2][_y2] && _board[_x2][_y2]==_board[i][j])){
					continue;
				}
				if(_conc[_x2][_y2]&&_conc[_x][_y]){
					continue;
				}
				_cf = false;
				break;
			}
			if(_cf){
				_change= true;
				_conc[i][j] = true;
				if(_board[i][j]==BLOCK_KIND.BLACK){
					_concBlack = _concBlack+1;
				}else if(_board[i][j]==BLOCK_KIND.WHITE){
					_concWhite = _concWhite+1;
				}
			}
		}
	}}


	this.player_color = player_color;
	this.board = _board;
	this.parentNode = parentNode;
	this.move = move;
	this.childNodes = null;
	// this.wins = _black / _sum;
	this.wins = 0.5 + _concBlack * 0.01 - _concWhite * 0.01;
	this.visits = 1;
}
Node.prototype.selectChild = function() {
	var totalVisits = this.visits;
	var values = this.childNodes.map(function(n) {
		var c = Math.sqrt(2);
		return n.wins / n.visits + c
				* Math.sqrt(Math.log(totalVisits) / n.visits);
	});
	return this.childNodes[values.indexOf(Math.max.apply(null, values))];
};
Node.prototype.expandChild = function() {
	this.childNodes = []
	for (var i = 0; i < BOARD_SIZE.HEIGHT; i++) {
		for (var j = 0; j < BOARD_SIZE.WIDTH; j++) {
			if (turnOverBlock(i, j, false, this.board, this.player_color) > 0) {
				var _board = [];
				for (var i2 = 0; i2 < BOARD_SIZE.HEIGHT + 1; i2++) {
					_board[i2] = [];
					for (var j2 = 0; j2 < BOARD_SIZE.WIDTH + 1; j2++) {
						_board[i2][j2] = this.board[i2][j2];
					}
				}
				turnOverBlock(i, j, true, _board, this.player_color)
				_board[i][j] = this.player_color;
				var child = new Node(_board, this, "" + i + j, BLOCK_KIND.MAX
						- this.player_color);
				this.childNodes.push(child);
			}
		}
	}
	if (this.childNodes.length == 0) {
		var child = new Node(this.board, this, "--", BLOCK_KIND.MAX
				- this.player_color);
		this.childNodes.push(child);
	}
	return this.childNodes.length;
};
Node.prototype.backpropagate = function(result) {
	for (var node = this; node !== null; node = node.parentNode)
		node.update(result);
};
Node.prototype.update = function(won) {
	this.wins += won;
	this.visits += 1;
};
var sturdy = function(won) {
	nowNode.backpropagate(won);
	return;
};

var optSturdy = function(won) {
	optNowNode.backpropagate(won);
	return;
};
var initTree = function() {
	root = new Node(board, null, null, player_color);
	var n = root.expandChild();
	console.log(n);
};

var optNextStep = function() {
	if (end || stop) {
		return;
	}
	var best = optNowNode.childNodes[0];
	if (best.move == "--") {
		optNowNode = best;
		best = optNowNode.childNodes[0];
	} else if (player_color == BLOCK_KIND.BLACK) {
		var max = best.wins / best.visits;
		for (var cn = 1; cn < optNowNode.childNodes.length; cn++) {
			var child = optNowNode.childNodes[cn];
			var tmp = child.wins / child.visits;
			if (max < tmp) {
				max = tmp;
				best = child;
			}
		}
	} else if (player_color == BLOCK_KIND.WHITE) {
		var max = (best.visits-best.wins) / best.visits;
		for (var cn = 1; cn < optNowNode.childNodes.length; cn++) {
			var child = optNowNode.childNodes[cn];
			var tmp = (child.visits-child.wins) / child.visits;
			if (max < tmp) {
				max = tmp;
				best = child;
			}
		}
	}
	var moveChar = best.move.split('');
	var _x = Number(moveChar[0]);
	var _y = Number(moveChar[1]);
	turnOverBlock(_x, _y, true, board, player_color)
	setBoard(_x, _y, player_color);
	optNowNode = best;
	for (var cn = 0; cn < nowNode.childNodes.length; cn++) {
		var child = nowNode.childNodes[cn];
		if (child.move == best.move) {
			nowNode = child;
			if (child.childNodes == null) {
				nowNode.expandChild();
			}
			break;
		}
	}
	if (optNowNode.childNodes == null) {
		optNowNode.expandChild();
	}
	if (!changePlayer(board, player_color)) {
		player_color = BLOCK_KIND.MAX - player_color;
	}
	showBoard();
};
var nextStep = function() {
	if (end) {
		return;
	}
	var best = nowNode.childNodes[0];
	if (best.move == "--") {
		nowNode = best;
		best = nowNode.childNodes[0];
	} else if (player_color == BLOCK_KIND.BLACK) {
		var max = best.wins / best.visits;
		if (bandit) {
			max = best.wins / best.visits + 2 * Math.sqrt(Math.log(nowNode.visits) / best.visits);
		}
		for (var cn = 1; cn < nowNode.childNodes.length; cn++) {
			var child = nowNode.childNodes[cn];
			var tmp = child.wins / child.visits;
			if(bandit){
				tmp = child.wins / child.visits + 2 * Math.sqrt(Math.log(nowNode.visits) / child.visits);
			}
			if (max < tmp) {
				max = tmp;
				best = child;
			}
		}
	} else if (player_color == BLOCK_KIND.WHITE) {
		var max = (best.visits-best.wins) / best.visits;
		if (bandit) {
			max = (best.visits- best.wins) / best.visits + 2 * Math.sqrt(Math.log(nowNode.visits) / best.visits);
		}
		for (var cn = 1; cn < nowNode.childNodes.length; cn++) {
			var child = nowNode.childNodes[cn];
			var tmp = (child.visits-child.wins) / child.visits;
			if(bandit){
				tmp = (child.visits-child.wins) / child.visits + 2 * Math.sqrt(Math.log(nowNode.visits) / child.visits);
			}
			if (max < tmp) {
				max = tmp;
				best = child;
			}
		}
	}
	var moveChar = best.move.split('');
	var _x = Number(moveChar[0]);
	var _y = Number(moveChar[1]);
	turnOverBlock(_x, _y, true, board, player_color)
	setBoard(_x, _y, player_color);
	nowNode = best;
	if(modeVS){
		for (var cn = 0; cn < optNowNode.childNodes.length; cn++) {
			var child = optNowNode.childNodes[cn];
			if (child.move == best.move) {
				optNowNode = child;
				if (child.childNodes == null) {
					optNowNode.expandChild();
				}
				break;
			}
		}
	}
	if (nowNode.childNodes == null) {
		nowNode.expandChild();
	}
	if (!changePlayer(board, player_color)) {
		player_color = BLOCK_KIND.MAX - player_color;
	}
	showBoard();
};
var OnClickButton = function(win) {

	if (rec.length > 0&&!noSturdy) {
		sturdy(win);
		rec = rec + "_" + win;
		records.push(rec);
	}
	console.log(records);
	initBoard();
	nowNode = root;
	showBoard();
	if (player > 0) {
		setTimeout(selfSturdy, 10);
	}

	if(modeVS){
		vsTotal = vsTotal + 1;
		if(BLOCK_KIND.WHITE - optColor != win){
			vsWin = vsWin + 1;
		}
		document.getElementById('victory').innerText = "勝率：" + ((100*vsWin/vsTotal).toFixed(1)) + "%";
		optColor = BLOCK_KIND.MAX - optColor;
		if(optColor == BLOCK_KIND.BLACK){
    		document.getElementById("myColor").className = "white";
    		document.getElementById("opColor").className = "black";
		}else{
    		document.getElementById("myColor").className = "black";
    		document.getElementById("opColor").className = "white";
		}
	}
};
var optOnClickButton = function(win) {
	optSturdy(win);
	optNowNode = optRoot;
};

var playMode = function() {
	playModeInit();
	$('#winBlack').removeAttr('type');
	$('#winWhite').removeAttr('type');
	$('#draw').removeAttr('type');
	$('#winBlack').attr({
		type : 'button'
	});
	$('#winWhite').attr({
		type : 'button'
	});
	$('#draw').attr({
		type : 'button'
	});
};

var hideMenu = function(){
	$('#startSturdy').attr({
		type : 'hidden'
	});
	$('#teach').attr({
		type : 'hidden'
	});
	$('#battle').attr({
		type : 'hidden'
	});
	$('#battleVS').attr({
		type : 'hidden'
	});
	$('#playBlack').attr({
		type : 'hidden'
	});
	$('#playWhite').attr({
		type : 'hidden'
	});
	$('#battleLearningLabel').hide();
	$('#battleOnlyLabel').hide();
}

var menueMode = function() {
	$('#startSturdy').removeAttr('type');
	$('#teach').removeAttr('type');
	$('#battle').removeAttr('type');
	$('#battleAIID').removeAttr('type');
	displayMenu();
};
var play = function(_player) {
	bandit = true;
	playMode();
	if (!root) {
		initTree();
	}
	optRoot = null;
	initBoard();
	showBoard();
	stop = false;
	player = _player;
	if(player == BLOCK_KIND.BLACK){
		document.getElementById("myColor").className = "white";
		document.getElementById("opColor").className = "black";
	}else{
		document.getElementById("myColor").className = "black";
		document.getElementById("opColor").className = "white";
	}
	selfSturdy();
};

var playModeInit = function() {
	hideMenu();
	end = false;
	document.getElementById("eff").className = "bomb";
	$('#stop').removeAttr('type');
	$('#stop').attr({
		type : 'button'
	});
}
var StartSturdy = function() {
	$('#sturding').attr({
		type : 'button'
	});
	document.getElementById("opMonster").className = "m1";
	bandit = true;
	playModeInit();
	if (!root) {
		initTree();
	}
	optRoot = null;
	initBoard();
	showBoard();
	stop = false;
	player = 0;
	selfSturdy();
};

var loadVSonly = function (file) {
	document.getElementById("opMonster").className = "m2";
	var oreader = new FileReader();
	oreader.readAsText(file[0]);
	if (!root) {
		initTree();
	}
	optRoot = new Node(board, null, null, player_color);
	optRoot.expandChild();
	initBoard();
	oreader.onload = function (ev) {
		const optDatalist = oreader.result.split(",");
		for (var i = 0; i < optDatalist.length; i++) {
			var tmp = optDatalist[i];
			var _rec = tmp.split('_')[0];
			var aStep = _rec.split("");
			for (var j = 0; j < aStep.length; j=j+2) {
				var _x = aStep[j];
				var _y = aStep[j+1];
				var _next = false;
				for (var cn = 0; cn < optNowNode.childNodes.length; cn++) {
					var child = optNowNode.childNodes[cn];
					if (child.move == "" + _x + _y) {
						optNowNode = child;
						if (child.childNodes == null) {
							optNowNode.expandChild();
						}
						_next = true;
						break;
					}
				}
				if(!_next){
					console.log("Error!!")
					return;
				}
			}
			optOnClickButton(Number(tmp.split('_')[1]));
		}
		playModeInit();
		document.getElementById("victory").style.display="";
		vsTotal = 0;
		vsWin = 0;
		stop = false;
		player = 0;
		optColor = 2;// player black first
		modeVS = true;
		noSturdy = true;
		bandit = false;
		selfSturdy();
	}
};

window.addEventListener('DOMContentLoaded', function() {
	document.getElementById('loadButton').addEventListener('click', clearFile);
	document.getElementById('battleLearning').addEventListener('click', clearFile);
	document.getElementById('battleOnly').addEventListener('click', clearFile);
});

var clearFile = function(){
	this.value = null;
}

var loadVS = function (file) {
	document.getElementById("opMonster").className = "m2";
	var oreader = new FileReader();
	oreader.readAsText(file[0]);
	if (!root) {
		initTree();
	}
	optRoot = new Node(board, null, null, player_color);
	optRoot.expandChild();
	initBoard();
	oreader.onload = function (ev) {
		const optDatalist = oreader.result.split(",");
		for (var i = 0; i < optDatalist.length; i++) {
			var tmp = optDatalist[i];
			var _rec = tmp.split('_')[0];
			var aStep = _rec.split("");
			for (var j = 0; j < aStep.length; j=j+2) {
				var _x = aStep[j];
				var _y = aStep[j+1];
				var _next = false;
				for (var cn = 0; cn < optNowNode.childNodes.length; cn++) {
					var child = optNowNode.childNodes[cn];
					if (child.move == "" + _x + _y) {
						optNowNode = child;
						if (child.childNodes == null) {
							optNowNode.expandChild();
						}
						_next = true;
						break;
					}
				}
				if(!_next){
					console.log("Error!!")
					return;
				}
			}
			optOnClickButton(Number(tmp.split('_')[1]));
		}
		playModeInit();
		document.getElementById("victory").style.display="";
		vsTotal = 0;
		vsWin = 0;
		stop = false;
		player = 0;
		optColor = 2;// player black first
		modeVS = true;
		selfSturdy();
	}
};

var loadVS2 = function (data) {
	$('#battleYellow').attr({
		type : 'hidden'
	});
	$('#battleBlue').attr({
		type : 'hidden'
	});
	$('#battleRed').attr({
		type : 'hidden'
	});
	if (!root) {
		initTree();
	}
	optRoot = new Node(board, null, null, player_color);
	optRoot.expandChild();
	initBoard();
	const optDatalist = data.split(",");
	for (var i = 0; i < optDatalist.length; i++) {
		var tmp = optDatalist[i];
		var _rec = tmp.split('_')[0];
		var aStep = _rec.split("");
		for (var j = 0; j < aStep.length; j=j+2) {
			var _x = aStep[j];
			var _y = aStep[j+1];
			var _next = false;
			for (var cn = 0; cn < optNowNode.childNodes.length; cn++) {
				var child = optNowNode.childNodes[cn];
				if (child.move == "" + _x + _y) {
					optNowNode = child;
					if (child.childNodes == null) {
						optNowNode.expandChild();
					}
					_next = true;
					break;
				}
			}
			if(!_next){
				console.log("Error!!")
				return;
			}
		}
		optOnClickButton(Number(tmp.split('_')[1]));
	}
	playModeInit();
	document.getElementById("victory").style.display="";
	vsTotal = 0;
	vsWin = 0;
	stop = false;
	player = 0;
	optColor = 2;// player black first
	modeVS = true;
	selfSturdy();
};

var loadSelf = function (file) {
	var reader = new FileReader();
	reader.readAsText(file[0]);
	initTree();
	initBoard();
	reader.onload = function (ev) {
		const inputDatalist = reader.result.split(",");
		for (var i = 0; i < inputDatalist.length; i++) {
			var tmp = inputDatalist[i];
			console.log(tmp);
			records.push(tmp);
			rec = tmp.split('_')[0];
			var aStep = rec.split("");
			for (var j = 0; j < aStep.length; j=j+2) {
				var _x = aStep[j];
				var _y = aStep[j+1];
				var _next = false;
				for (var cn = 0; cn < nowNode.childNodes.length; cn++) {
					var child = nowNode.childNodes[cn];
					if (child.move == "" + _x + _y) {
						nowNode = child;
						if (child.childNodes == null) {
							nowNode.expandChild();
						}
						_next = true;
						break;
					}
				}
				if(!_next){
					console.log("Error!!")
					return;
				}
			}
			OnClickButton(Number(tmp.split('_')[1]));
		}
	}
};

var selfSturdy = function() {
	if(modeVS){
		if(player_color == optColor) {
			optNextStep();
			setTimeout(selfSturdy, sleepTime);
		}else{
			nextStep();
			setTimeout(selfSturdy, sleepTime);
		}
	}else if (stop || player_color == player) {
	} else {
		nextStep();
		setTimeout(selfSturdy, sleepTime);
	}
};

var displayMenu = function() {
	$('#startSturdy').attr({
		type : 'button'
	});
	$('#sturding').attr({
		type : 'hidden'
	});
	$('#teach').attr({
		type : 'button'
	});
	$('#battle').attr({
		type : 'button'
	});
	$('#battleVS').attr({
		type : 'button'
	});
	$('#playBlack').attr({
		type : 'hidden'
	});
	$('#playWhite').attr({
		type : 'hidden'
	});
	$('#winBlack').attr({
		type : 'hidden'
	});
	$('#draw').attr({
		type : 'hidden'
	});
	$('#winWhite').attr({
		type : 'hidden'
	});
	$('#stop').attr({
		type : 'hidden'
	});
	$('#battleYellow').attr({
		type : 'hidden'
	});
	$('#battleBlue').attr({
		type : 'hidden'
	});
	$('#battleRed').attr({
		type : 'hidden'
	});
	$('#battleLearningLabel').hide();
	$('#battleOnlyLabel').hide();
}

var StopSturdy = function() {
	document.getElementById("opMonster").className = "";
	document.getElementById("eff").className = "noBomb";
	if (player > 0) {
		menueMode();
	} else {
		$('#startSturdy').removeAttr('type');
		$('#teach').removeAttr('type');
		$('#battle').removeAttr('type');
		$('#battleAIID').removeAttr('type');
		displayMenu();
	}
	document.getElementById("victory").style.display="none";
	document.getElementById("myColor").className = "black";
	document.getElementById("opColor").className = "white";
	player = 0;
	initBoard();
	showBoard();
	stop = true;
	end = true;
	modeVS = false;
	noSturdy = false;
	showProgress();
	document.getElementById('victory').innerText = "勝率：0.0%";
};

var teachF = function() {
	playModeInit();
	document.getElementById("opMonster").className = "teacher";
	document.getElementById("eff").className = "noBomb";
	$('#playBlack').attr({
		type : 'button'
	});
	$('#playWhite').attr({
		type : 'button'
	});
};

var battleF = function() {
	playModeInit();
	document.getElementById("eff").className = "noBomb";
	$('#battleYellow').attr({
		type : 'button'
	});
	$('#battleBlue').attr({
		type : 'button'
	});
	$('#battleRed').attr({
		type : 'button'
	});
};

var battleYellowF = function() {
	document.getElementById("opMonster").className = "op1";
	loadVS2(MONSTER_DATA.YELLOW);
};

var battleBlueF = function() {
	document.getElementById("opMonster").className = "op2";
	loadVS2(MONSTER_DATA.BLUE);
};

var battleRedF = function() {
	document.getElementById("opMonster").className = "op3";
	loadVS2(MONSTER_DATA.RED);
};

var battleVSF = function () {
	playModeInit();
	document.getElementById("eff").className = "noBomb";
	$('#battleLearningLabel').show();
	$('#battleOnlyLabel').show();
};

// monster data
var el = document.createElement("script");
el.src = "js/data.js";
document.body.appendChild(el);

'use strict';

var closeButton = document.getElementById('closeButton');
closeButton.addEventListener('click', () => {remote.getCurrentWindow().close()});

var pauseButton;
var tries = 0;
var r = 0;
var cipher;
var rows = [];
var timer;
var timeState;
var gameState;	//0 = not yet started, 1 = timer started, 2 = game over

class Stopwatch
{
	constructor(div, delay)
	{
		this.offset = -1;
		this.interval = null;
		this.div = div;
		this.delay = delay;
		this.elapsed = 0;
	}

	static msToTime(ms) 
	{
    	// Pad to 2 or 3 digits, default is 2
  		var pad = (n, z = 2) => ('00' + n).slice(-z);
  		//return pad(ms/3.6e6|0) + ':' + pad((ms%3.6e6)/6e4 | 0) + ':' + pad((ms%6e4)/1000|0) + '.' + pad(ms%1000, 3);
  		return pad((ms%3.6e6)/6e4 | 0) + ':' + pad((ms%6e4)/1000|0);
	}

	show()
	{
		var minutes = 0;
		var seconds = 0;
		var passed = this.elapsed/1000;
		while (passed >= 60)
		{
			minutes++;
			passed -= 60;
		}
		seconds = Math.floor(passed);
		//this.div.innerHTML = minutes + ':' + seconds; 
		this.div.innerHTML = Stopwatch.msToTime(this.elapsed);
	}

	start()
	{
		if (!this.interval)
		{
			this.offset = Date.now();
			this.interval = setInterval(() => this.update(), this.delay);	
		}
	}

	stop()
	{
		if (this.interval)
		{
			clearInterval(this.interval);
			this.interval = null;
		}
		return this.elapsed;
	}

	reset()
	{
		this.elapsed = 0;
		this.show();
	}

	delta()
	{
		var now = Date.now();
		var passed = now-this.offset;
		this.offset = now;
		return passed;
	}

	update()
	{
		var now = Date.now();
		this.elapsed += now-this.offset;
		this.offset = now;
		this.show();
	}
}

class Box
{
	constructor(column)
	{
		this.column = column;
		this.boxColor = 0; 		//0 = white, 1 = red, 2 = blue, 3 = green, 4 = yellow, 5 = black
		this.button = document.createElement('button');
		this.button.setAttribute('class', 'colorButton');
		this.button.addEventListener('click', () => this.changeColor());
	}

	changeColor()
	{
		this.boxColor = this.boxColor + 1;
		this.updateColor();
	}

	setColor(newColor)
	{
		this.boxColor = newColor;
		this.updateColor();
	}

	updateColor()
	{
		switch (this.boxColor) 
		{
			case 6: 
				this.boxColor = 0;
			case 0:
				this.button.style.backgroundColor = 'white';
				break;
			case 1: 
				this.button.style.backgroundColor = 'red';
				break;
			case 2:
				this.button.style.backgroundColor = 'blue';
				break;
			case 3: 
				this.button.style.backgroundColor = 'green';
				break;
			case 4:
				this.button.style.backgroundColor = 'yellow';
				break;
			case 5:
				this.button.style.backgroundColor = 'black';
				break;
			default:
				this.button.style.backgroundColor = 'white';
				break;
		}
	}
}

class Row 
{
	constructor(id, numBoxes)
	{
		this.id = id;
		this.submit = 6666;
		this.div = document.createElement('div');
		this.div.setAttribute('class', 'rowDiv');
		this.createBoxes(numBoxes);
		this.submitButton = document.createElement('button');
		this.submitButton.setAttribute('class', 'submitButton');
		this.submitButton.innerHTML = 'Check';
		this.submitButton.addEventListener('click', () => this.checkRow());
		this.div.appendChild(this.submitButton);
		document.body.appendChild(this.div);
	}

	createBoxes(numBoxes)
	{
		this.boxList = [];
		for (let i = 0; i < numBoxes; i++)
		{
			this.boxList.push(new Box(i));
			this.div.appendChild(this.boxList[i].button);
		}
	}

	checkRow()
	{
		this.submit = '';
		for (let i = 0; i < this.boxList.length; i++)
		{
			//console.log(this.boxList[i].boxColor);
			this.submit += this.boxList[i].boxColor + '';
			//console.log(this.submit);
		}
		var attempt = this.submit.split('');
		var key = cipher.split('');
		var reds = 0;					//reds = both color and location match
		var whites = 0;					//whites = color only match
		for (let i = 0; i < attempt.length; i++)
		{
			for (let z = 0; z < key.length; z++)
			{
				if (attempt[i] == key[z])
				{
					if (i == z)
					{
						reds++;
						attempt[i] = -2; //2352, run 4251
						key[z] = -1;
					}
				}
			}
		}
		for (let i = 0; i < attempt.length; i++)
		{
			for (let z = 0; z < key.length; z++)
			{
				if (attempt[i] == key[z])
				{
					whites++;
					attempt[i] = -2;
					key[z] = -1;
				}
			}
		}
		this.div.removeChild(this.submitButton);
		this.submitButton = document.createElement('div');
		this.submitButton.setAttribute('class', 'submitButton');
		this.div.appendChild(this.submitButton);
		for (let i = 0; i < reds; i++)
		{
			var currPeg = document.createElement('button');
			currPeg.setAttribute('class', 'peg');
			currPeg.style.backgroundColor = 'red';
			if (i == 0)
			{
				currPeg.style.marginLeft = '6px';
			}
			this.submitButton.appendChild(currPeg);
		}
		for (let i = 0; i < whites; i++)
		{
			var currPeg = document.createElement('button');
			currPeg.setAttribute('class', 'peg');
			currPeg.style.backgroundColor = 'white';
			if (reds == 0 && i == 0)
			{
				currPeg.style.marginLeft = '6px';
			}
			this.submitButton.appendChild(currPeg);
		}
		/*if (reds == 0 && whites == 0)
		{
			this.submitButton.innerHTML = '<p align="center" margin-bottom=5px>☹</p>';
		}*/
		updateGame(reds);
		for (let i = 0; i < this.boxList.length; i++)
		{
			//clone and replace to remove click event listener
			var newButton = this.boxList[i].button.cloneNode(true);
			this.boxList[i].button.parentNode.replaceChild(newButton, this.boxList[i].button);
		}
	}
}

startGame();

function startGame()
{
	for (let i = 0; i < rows.length; i++)
	{
		rows[i].div.parentNode.removeChild(rows[i].div);
	}
	gameState = 0;
	tries = 0;
	rows = [];
	r = 0;
	cipher = genCipher();
	timer = new Stopwatch(document.getElementById('stopwatch'), 10);
	timer.show();
	timeState = 'paused';
	pauseButton = document.getElementById('pauseButton');
	pauseButton.innerHTML = '▶';
	pauseButton.addEventListener('click', pause);
	for (let i = 0; i < 9; i++)
	{
		rows.push(new Row(i, 4));
		rows[i].div.style.visibility = 'hidden';
	}
	rows[0].div.style.visibility = 'visible';
}

function updateGame(reds)
{
	r++;
	if (r >= 8)
	{
		reveal();
	}
	else if (reds == 4)
	{
		reveal();
	}
	else
	{
		rows[r].div.style.visibility = 'visible';
	}
	if (r == 1)
	{
		gameState = 1;
		timeState = 'paused';
		pause();
		timer.start();
	}
}

function pause()
{
	if (r == 0)
	{
		return;
	}
	else if (gameState == 2)
	{
		pauseButton.innerHTML = '▶';
		timeState = 'paused';
		timer.stop();
	}
	else if (timeState == 'unpaused') 
	{
		timeState = 'paused';
		pauseButton.innerHTML = '▶';
		timer.stop();
		if (rows[8].div.style.visibility == 'hidden')
		{
			for (let i = 0; i <= r; i++)
			{
				rows[i].div.style.visibility = 'hidden';
			}
		}
	}
	else
	{
		for (let i = 0; i <= r; i++)
		{
			rows[i].div.style.visibility = 'visible';
		}
		timeState = 'unpaused';
		pauseButton.innerHTML = '❚❚';
		timer.start();
	}
}

function reveal()
{
	gameState = 2;
	for (let i = 0; i < rows[8].boxList.length; i++)
	{
		rows[8].boxList[i].setColor(parseInt(cipher.charAt(i)));
		var newButton = rows[8].boxList[i].button.cloneNode(true);
		rows[8].boxList[i].button.parentNode.replaceChild(newButton, rows[8].boxList[i].button);
	}
	var newSubmitButton = rows[8].submitButton.cloneNode(true);
	rows[8].submitButton.parentNode.replaceChild(newSubmitButton, rows[8].submitButton);
	rows[8].submitButton = newSubmitButton;
	rows[8].submitButton.innerHTML = 'New Game';
	rows[8].submitButton.addEventListener('click', startGame);
	rows[8].div.style.visibility = 'visible';
	pause();
}

function genCipher() 
{
	var code = '';
	for (let i = 0; i < 4; i++)
	{
		code += Math.floor(Math.random()*6) + '';
	}
	return code;
}
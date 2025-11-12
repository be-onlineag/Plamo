(function(){
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const c = canvas.getContext('2d');

  function resize() {
    const ratio = 960 / 540;
    const w = Math.min(canvas.parentElement.clientWidth, 960);
    const h = Math.round(w / ratio);
    canvas.width = 960;
    canvas.height = 540;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  const W = () => canvas.width;
  const H = () => canvas.height;

  // Game state
  let gameRunning = true;
  let currentPlayer = 'X';
  let board = Array(9).fill('');
  let gameOver = false;
  let winner = null;
  
  // Score tracking
  let scores = {
    X: parseInt(localStorage.getItem('ttt_x_wins') || '0', 10),
    O: parseInt(localStorage.getItem('ttt_o_wins') || '0', 10),
    draws: parseInt(localStorage.getItem('ttt_draws') || '0', 10),
    gamesPlayed: parseInt(localStorage.getItem('ttt_games') || '0', 10)
  };

  // Game board dimensions
  const boardSize = 300;
  const cellSize = boardSize / 3;
  const boardX = (W() - boardSize) / 2;
  const boardY = (H() - boardSize) / 2;

  // Mouse interaction
  canvas.addEventListener('click', handleClick);
  
  function handleClick(event) {
    if (!gameRunning || gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;
    
    // Check if click is within the board
    if (mouseX >= boardX && mouseX <= boardX + boardSize && 
        mouseY >= boardY && mouseY <= boardY + boardSize) {
      
      const col = Math.floor((mouseX - boardX) / cellSize);
      const row = Math.floor((mouseY - boardY) / cellSize);
      const index = row * 3 + col;
      
      if (board[index] === '') {
        board[index] = currentPlayer;
        checkWin();
        if (!gameOver) {
          currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        }
      }
    }
  }

  function checkWin() {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        winner = board[a];
        gameOver = true;
        updateScores();
        return;
      }
    }
    
    // Check for draw
    if (board.every(cell => cell !== '')) {
      gameOver = true;
      winner = 'draw';
      updateScores();
    }
  }

  function updateScores() {
    scores.gamesPlayed++;
    if (winner === 'draw') {
      scores.draws++;
      localStorage.setItem('ttt_draws', String(scores.draws));
    } else {
      scores[winner]++;
      localStorage.setItem(`ttt_${winner.toLowerCase()}_wins`, String(scores[winner]));
    }
    localStorage.setItem('ttt_games', String(scores.gamesPlayed));
    
    // Update leaderboard
    const lb = JSON.parse(localStorage.getItem('ttt_leaderboard') || '[]');
    lb.push({
      winner: winner,
      at: new Date().toISOString()
    });
    localStorage.setItem('ttt_leaderboard', JSON.stringify(lb.slice(-100)));
  }

  function drawBoard() {
    // Draw grid
    c.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    c.lineWidth = 3;
    
    // Vertical lines
    for (let i = 1; i < 3; i++) {
      c.beginPath();
      c.moveTo(boardX + i * cellSize, boardY);
      c.lineTo(boardX + i * cellSize, boardY + boardSize);
      c.stroke();
    }
    
    // Horizontal lines
    for (let i = 1; i < 3; i++) {
      c.beginPath();
      c.moveTo(boardX, boardY + i * cellSize);
      c.lineTo(boardX + boardSize, boardY + i * cellSize);
      c.stroke();
    }
    
    // Draw X's and O's
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const index = row * 3 + col;
        const x = boardX + col * cellSize + cellSize / 2;
        const y = boardY + row * cellSize + cellSize / 2;
        
        if (board[index] === 'X') {
          drawX(x, y);
        } else if (board[index] === 'O') {
          drawO(x, y);
        }
      }
    }
  }

  function drawX(x, y) {
    c.strokeStyle = '#3B82F6';
    c.lineWidth = 8;
    c.lineCap = 'round';
    const offset = 30;
    
    c.beginPath();
    c.moveTo(x - offset, y - offset);
    c.lineTo(x + offset, y + offset);
    c.stroke();
    
    c.beginPath();
    c.moveTo(x + offset, y - offset);
    c.lineTo(x - offset, y + offset);
    c.stroke();
  }

  function drawO(x, y) {
    c.strokeStyle = '#EF4444';
    c.lineWidth = 8;
    c.beginPath();
    c.arc(x, y, 35, 0, Math.PI * 2);
    c.stroke();
  }

  function drawHUD() {
    // Current player
    c.fillStyle = 'rgba(255, 255, 255, 0.9)';
    c.font = '24px Inter, Arial';
    c.textAlign = 'center';
    
    if (!gameOver) {
      c.fillText(`Current Player: ${currentPlayer}`, W() / 2, 60);
    } else {
      if (winner === 'draw') {
        c.fillText("It's a Draw!", W() / 2, 60);
      } else {
        c.fillText(`${winner} Wins!`, W() / 2, 60);
      }
    }
    
    // Scores
    c.font = '18px Inter, Arial';
    c.textAlign = 'left';
    c.fillText(`X Wins: ${scores.X}`, 20, 30);
    c.fillText(`O Wins: ${scores.O}`, 20, 55);
    c.fillText(`Draws: ${scores.draws}`, 20, 80);
    c.fillText(`Games: ${scores.gamesPlayed}`, 20, 105);
    
    // Instructions
    c.textAlign = 'center';
    c.font = '16px Inter, Arial';
    c.fillStyle = 'rgba(255, 255, 255, 0.7)';
    if (!gameOver) {
      c.fillText('Click on the grid to make your move', W() / 2, H() - 30);
    } else {
      c.fillText('Click "New Game" to play again', W() / 2, H() - 30);
    }
  }

  function loop() {
    c.clearRect(0, 0, W(), H());
    drawBoard();
    drawHUD();
    requestAnimationFrame(loop);
  }

  function newGame() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameOver = false;
    winner = null;
    gameRunning = true;
  }

  function resetScores() {
    scores = { X: 0, O: 0, draws: 0, gamesPlayed: 0 };
    localStorage.removeItem('ttt_x_wins');
    localStorage.removeItem('ttt_o_wins');
    localStorage.removeItem('ttt_draws');
    localStorage.removeItem('ttt_games');
    localStorage.removeItem('ttt_leaderboard');
  }

  // Button event listeners
  document.getElementById('btn-pause')?.addEventListener('click', newGame);
  document.getElementById('btn-restart')?.addEventListener('click', resetScores);

  // Keyboard controls
  window.addEventListener('keydown', e => {
    if (e.key === 'r' || e.key === 'R') newGame();
    if (e.key === 'c' || e.key === 'C') resetScores();
  });

  // Start the game loop
  requestAnimationFrame(loop);
})();
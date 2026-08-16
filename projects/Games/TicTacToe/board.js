let board = [
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
];
let turn = 1;

let cell1 = document.getElementById("cell1");
let cell2 = document.getElementById("cell2");
let cell3 = document.getElementById("cell3");
let cell4 = document.getElementById("cell4");
let cell5 = document.getElementById("cell5");
let cell6 = document.getElementById("cell6");
let cell7 = document.getElementById("cell7");
let cell8 = document.getElementById("cell8");
let cell9 = document.getElementById("cell9");

const boardToCell = new Map([
  [cell1, [0, 0]],
  [cell2, [0, 1]],
  [cell3, [0, 2]],
  [cell4, [1, 0]],
  [cell5, [1, 1]],
  [cell6, [1, 2]],
  [cell7, [2, 0]],
  [cell8, [2, 1]],
  [cell9, [2, 2]]
]);

function checkWin() {
  let win = false;
  let winner = null;

  for (let row of board) {
    if (row.every((val) => val === row[0]) && row[0] !== 0) {
      win = true;
      winner = row[0];
      break;
    }
  }

  for (let col = 0; col < 3; col++) {
    if (
      board.every((row) => row[col] === board[0][col]) &&
      board[0][col] !== 0
    ) {
      win = true;
      winner = board[0][col];
      break;
    }
  }

  if (
    board[0][0] !== 0 &&
    board[0][0] == board[1][1] &&
    board[0][0] == board[2][2]
  ) {
    win = true;
    winner = board[0][0];
  } else if (
    board[2][0] !== 0 &&
    board[2][0] == board[1][1] &&
    board[2][0] == board[0][2]
  ) {
    win = true;
    winner = board[2][0];
  }

  if (winner == null) {
    return win;
  } else {
    return winner;
  }
}

function update(row, col, el) {
  cell = boardToCell.get(el)
  el.style.cursor = "default";
  board[cell[0]][cell[1]] = turn
  if (turn == 1){
    turn ++;
    el.style.backgroundColor = "red";
  } else {
    turn --;
    el.style.backgroundColor = "green";
  }
  let win = checkWin()
  if (win != false) {
    setTimeout(() => {
      alert(win);
    }, 100)
  }
}

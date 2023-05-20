const backURL = "https://skypro-rock-scissors-paper.herokuapp.com/";
const app = document.querySelector(".app");

window.application.blocks["top-content"] = function renderTopContent(
  title,
  subtitle
) {
  const topHeader = document.createElement("h1");
  topHeader.textContent = title;
  app.appendChild(topHeader);

  const enemyNickname = document.createElement("p");
  enemyNickname.textContent = subtitle;
  app.appendChild(enemyNickname);
};

function renderLoginBlock(form) {
  const buttonLogin = document.createElement("button");
  buttonLogin.textContent = "Войти";
  buttonLogin.setAttribute("type", "submit");
  buttonLogin.classList.add('button');

  const inputNicknameGame = document.createElement("input");
  inputNicknameGame.classList.add('input');
  inputNicknameGame.setAttribute('placeholder', 'Введите ваш логин ...');

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    request({
      url: `${backURL}login`,
      params: {
        login: inputNicknameGame.value,
      },
      onSuccess: (data) => {
        window.application.token = data.token;

        request({
          url: `${backURL}player-status`,
          params: {
            token: window.application.token,
          },
          onSuccess: (data) => {
            const status = data["player-status"].status;

            if (status === "lobby") {
              window.application.renderScreen("lobby");
            } else if (status === "game") {
              window.application.id = data["player-status"].game.id;
              window.application.renderScreen("game");
            }
          },
        });
      },
    });
  });

  form.appendChild(inputNicknameGame);
  form.appendChild(buttonLogin);
}

window.application.blocks["login"] = renderLoginBlock;

function renderLoginScreen() {
  const nameGame = document.createElement("h1");
  nameGame.textContent = "Камень, ножницы, бумага";

  const nicknameGame = document.createElement("h3");
  nicknameGame.textContent = "Никнейм";

  const formNickname = document.createElement("form");

  app.appendChild(nameGame);
  app.appendChild(nicknameGame);
  app.appendChild(formNickname);

  window.application.renderBlock("login", formNickname);
}

window.application.screens["login"] = renderLoginScreen;
window.application.renderScreen("login");

function renderLobbyScreen() {
  const lobby = document.createElement("h1");
  lobby.textContent = "Лобби";
  app.appendChild(lobby);

  const playerListTop = document.createElement("div");
  app.appendChild(playerListTop);

  window.application.renderBlock("player-list", playerListTop);
  window.application.renderBlock("button-start", app);
}

window.application.screens["lobby"] = renderLobbyScreen;

function renderPlayerListBlock(container) {
  const playersListIntervalId = setInterval(() => {
    request({
      url: `${backURL}player-list`,
      params: {
        token: window.application.token,
      },
      onSuccess: (data) => {
        const player = document.createElement("div");
        const arrayPlayerList = data.list;

        for (let i = 0; i < arrayPlayerList.length; i++) {
          const playerList = document.createElement("p");
          playerList.textContent = data.list[i].login;
          player.appendChild(playerList);
        }
        container.replaceChildren();
        container.appendChild(player);
      },
    });
  }, 1000);
  window.application.timers.push(playersListIntervalId);
}

window.application.blocks["player-list"] = renderPlayerListBlock;

function renderButtonStart(container) {
  const buttonLobby = document.createElement("button");
  buttonLobby.textContent = "Играть!";
  buttonLobby.classList.add('button');

  buttonLobby.addEventListener("click", () => {
    request({
      url: `${backURL}start`,
      params: {
        token: window.application.token,
      },
      onSuccess: (data) => {
        const gameId = data["player-status"].game.id;
        window.application.id = gameId;
        window.application.renderScreen("waiting-enemy");
      },
    });
  });
  container.appendChild(buttonLobby);
}

window.application.blocks["button-start"] = renderButtonStart;

function renderWaitingEnemyBlock(container) {
  window.application.blocks["top-content"]("Игра", "");

  const waitingEnemy = document.createElement("h3");
  waitingEnemy.textContent = "Ожидаем подключение соперника...";
  container.appendChild(waitingEnemy);

  const waitingEnemyInterval = setInterval(function () {
    request({
      url: `${backURL}game-status`,
      params: {
        token: window.application.token,
        id: window.application.id,
      },
      onSuccess: (data) => {
        gameStatus = data["game-status"].status;

        if (gameStatus !== "waiting-for-start") {
          window.application.enemy = data["game-status"].enemy.login;
          window.application.renderScreen("game");
        }
      },
    });
  }, 1000);
  window.application.timers.push(waitingEnemyInterval);
}

window.application.blocks["waiting-enemy"] = renderWaitingEnemyBlock;

function renderWaitingGameScreen() {
  window.application.renderBlock("waiting-enemy", app);
}
window.application.screens["waiting-enemy"] = renderWaitingGameScreen;

function renderGameScreen() {
  const enemyLogin = document.createElement("h3");
  enemyLogin.textContent = `Вы играете против ${window.application.enemy}`;

  window.application.blocks["top-content"]("Игра", enemyLogin.textContent);

  const buttonsContainer = document.createElement("div");
  window.application.renderBlock("game", buttonsContainer);
  app.appendChild(buttonsContainer);
}

window.application.screens["game"] = renderGameScreen;

function renderGameBlock(container) {
  const rockButton = document.createElement("button");
  rockButton.textContent = "Камень";
  rockButton.classList.add('button');
  rockButton.addEventListener("click", () => {
    moveRequest("rock");
  });
  container.appendChild(rockButton);

  const scissorsButton = document.createElement("button");
  scissorsButton.textContent = "Ножницы";
  scissorsButton.classList.add('button');
  scissorsButton.addEventListener("click", () => {
    moveRequest("scissors");
  });
  container.appendChild(scissorsButton);

  const paperButton = document.createElement("button");
  paperButton.textContent = "Бумага";
  paperButton.classList.add('button');
  paperButton.addEventListener("click", () => {
    moveRequest("paper");
  });
  container.appendChild(paperButton);

  function moveRequest(move) {
    request({
      url: `${backURL}play`,
      params: {
        token: window.application.token,
        id: window.application.id,
        move: move,
      },
      onSuccess: (data) => {
        const status = data["game-status"].status;

        if (status === "waiting-for-enemy-move") {
          window.application.renderScreen("waiting-enemy-move");
        } else if (status === "lose") {
          window.application.renderScreen("lose");
        } else if (status === "win") {
          window.application.renderScreen("win");
        }
      },
    });
  }
}

window.application.blocks["game"] = renderGameBlock;

function renderWaitingMoveBlock(container) {
  const enemyLogin = document.createElement("h3");
  enemyLogin.textContent = `Вы играете против ${window.application.enemy}`;

  window.application.blocks["top-content"]("Игра", enemyLogin.textContent);
  const waitingMove = document.createElement("h3");
  waitingMove.textContent = "Ожидаем ход соперника...";
  container.appendChild(waitingMove);

  const intervalId = setInterval(() => {
    request({
      url: `${backURL}game-status`,
      params: {
        token: window.application.token,
        id: window.application.id,
      },
      onSuccess: (data) => {
        const status = data["game-status"].status;
        if (status === "lose") {
          window.application.renderScreen("lose");
        } else if (status === "win") {
          window.application.renderScreen("win");
        } else if (status === "waiting-for-your-move") {
          window.application.renderScreen("play");
        }
      },
    });
  }, 1000);

  window.application.timers.push(intervalId);
}

window.application.blocks["waiting-enemy-move"] = renderWaitingMoveBlock;

function renderWaitingMoveScreen() {
  window.application.renderBlock("waiting-enemy-move", app);
}
window.application.screens["waiting-enemy-move"] = renderWaitingMoveScreen;

function renderWinBlock(container) {
//   const enemyLogin = document.createElement("h3");
//   enemyLogin.textContent = `Вы играете против ${window.application.enemy}`;
//   window.application.blocks["top-content"]("Игра", enemyLogin.textContent);

  const userWin = document.createElement("h2");
  userWin.textContent = "Вы выиграли !";
  container.appendChild(userWin);
}
window.application.blocks["win"] = renderWinBlock;

function renderToLobbyBlock(container) {
  const buttonLobby = document.createElement("button");
  buttonLobby.textContent = "Перейти в лобби";
  buttonLobby.classList.add('button');
  buttonLobby.addEventListener("click", () => {
    window.application.renderScreen("lobby");
  });
  container.appendChild(buttonLobby);
}
window.application.blocks["to-lobby"] = renderToLobbyBlock;

function renderWinScreen() {
  window.application.renderBlock("win", app);
  window.application.renderBlock("to-lobby", app);
  window.application.renderBlock("button-start", app);
}
window.application.screens["win"] = renderWinScreen;

function renderLoseBlock(container) {
//   const enemyLogin = document.createElement("h3");
//   enemyLogin.textContent = `Вы играете против ${window.application.enemy}`;
//   window.application.blocks["top-content"]("Игра", enemyLogin.textContent);

  const userLose = document.createElement("h2");
  userLose.textContent = "Вы проиграли!";
  container.appendChild(userLose);
}
window.application.blocks["lose"] = renderLoseBlock;

function renderLoseScreen() {
  window.application.renderBlock("lose", app);
  window.application.renderBlock("to-lobby", app);
  window.application.renderBlock("button-start", app);
}
window.application.screens["lose"] = renderLoseScreen;

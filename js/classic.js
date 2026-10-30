(() => {
	"use strict";

	const { $, on } = window.dom;
	const TOTAL_MOVES = 10;
	const CHOICES = ["rock", "paper", "scissors"];
	const BEATS = {
		rock: "scissors",
		paper: "rock",
		scissors: "paper",
	};

	const els = {
		options: $(".options"),
		movesLeft: $(".movesleft"),
		result: $(".result"),
		prompt: $(".move"),
		reload: $(".reload"),
		playerScore: $(".p-count"),
		computerScore: $(".c-count"),
	};

	const state = {
		playerScore: 0,
		computerScore: 0,
		moves: 0,
		over: false,
	};

	const pickComputer = () => CHOICES[Math.floor(Math.random() * CHOICES.length)];

	const paint = (el, styles) => {
		Object.assign(el.style, styles);
	};

	const showRoundResult = (text) => {
		els.result.textContent = text;
		paint(els.result, { background: "rgba(0,0,0,0.3)" });
	};

	const scorePlayer = () => {
		state.playerScore += 1;
		els.playerScore.textContent = state.playerScore;
		showRoundResult("Player Won");
	};

	const scoreComputer = () => {
		state.computerScore += 1;
		els.computerScore.textContent = state.computerScore;
		showRoundResult("Computer Won");
	};

	const decideWinner = (playerMove, computerMove) => {
		const player = playerMove.toLowerCase();
		const computer = computerMove.toLowerCase();

		if (player === computer) {
			showRoundResult("Tie");
			return;
		}

		if (BEATS[player] === computer) {
			scorePlayer();
			return;
		}

		scoreComputer();
	};

	const finishBanner = (text, color) => {
		els.result.innerText = text;
		paint(els.result, {
			fontSize: "2rem",
			color,
			background: "rgba(0,0,0,0.7)",
			padding: "10px",
		});
	};

	const gameOver = () => {
		state.over = true;
		els.options.querySelectorAll("button").forEach((button) => {
			button.style.display = "none";
		});

		els.prompt.innerText = "Game Over !!!";
		paint(els.prompt, {
			background: "rgba(0,0,0,0.7)",
			color: "#878787",
			padding: "10px",
		});
		els.movesLeft.style.display = "none";

		if (state.playerScore > state.computerScore) {
			finishBanner("You Won The Game", "#308D46");
		} else if (state.playerScore < state.computerScore) {
			finishBanner("You Lost The Game", "red");
		} else {
			finishBanner("Tie", "grey");
		}

		els.reload.innerText = "Restart";
		els.reload.style.display = "flex";
	};

	const playMove = (playerChoice) => {
		if (state.over) {
			return;
		}

		state.moves += 1;
		els.movesLeft.innerText = `Moves Left: ${TOTAL_MOVES - state.moves}`;
		decideWinner(playerChoice, pickComputer());

		if (state.moves === TOTAL_MOVES) {
			gameOver();
		}
	};

	on(els.options, "click", "[data-choice]", (event, button) => {
		playMove(button.dataset.choice);
	});

	els.reload.addEventListener("click", () => {
		window.location.reload();
	});
})();

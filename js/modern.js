(() => {
	"use strict";

	const { $, $$, byId, on } = window.dom;

	const CHOICES = ["rock", "paper", "scissors"];
	const KEYS = { r: "rock", p: "paper", s: "scissors" };
	const BEATS = {
		rock: "scissors",
		paper: "rock",
		scissors: "paper",
	};
	const VERB = {
		rock: "crushes",
		paper: "covers",
		scissors: "cut",
	};
	const ASSETS = {
		rock: "assets/rock.png",
		paper: "assets/paper.png",
		scissors: "assets/scissors.png",
	};
	const RESULT_WORD = {
		win: "You",
		lose: "CPU",
		draw: "Draw",
	};
	const MAX_ROUNDS = 99;
	const THINK_MS = 720;
	const HOLD_MS = 1100;

	const els = Object.fromEntries(
		Object.entries({
			setup: "setup-screen",
			play: "play-screen",
			over: "over-screen",
			form: "custom-match",
			input: "match-spec",
			error: "match-error",
			playerScore: "player-score",
			computerScore: "computer-score",
			matchLabel: "match-label",
			roundLabel: "round-label",
			playerArt: "player-art",
			computerArt: "computer-art",
			playerPedestal: "player-pedestal",
			computerPedestal: "computer-pedestal",
			status: "status",
			history: "history",
			choices: "choices",
			overKicker: "over-kicker",
			overTitle: "over-title",
			finalScore: "final-score",
			overCopy: "over-copy",
		}).map(([key, id]) => [key, byId(id)]),
	);

	const hitCache = new Map();
	const state = {
		match: null,
		playerScore: 0,
		computerScore: 0,
		round: 0,
		locked: false,
		history: [],
		timer: 0,
	};

	const prefersReducedMotion = () =>
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

	const clampInt = (value) => {
		const number = Number.parseInt(value, 10);
		if (!Number.isFinite(number) || number < 1) {
			return null;
		}
		return Math.min(number, MAX_ROUNDS);
	};

	const fail = (message) => ({ ok: false, message });
	const ok = (match) => ({ ok: true, match });

	const numbered = (text, regex) => {
		const bits = text.match(regex);
		return bits ? clampInt(bits[1]) : null;
	};

	const parseMatchSpec = (raw) => {
		const text = String(raw || "").trim().toLowerCase();
		if (!text) {
			return fail("Type a match, or pick one of the cards above.");
		}

		const bestOf = numbered(text, /(?:best\s*of|bo)\s*(\d+)/);
		if (bestOf) {
			return ok({
				type: "best-of",
				length: bestOf,
				target: Math.floor(bestOf / 2) + 1,
				label: `Best of ${bestOf}`,
			});
		}
		if (/(?:best\s*of|bo)\s*\d*/.test(text)) {
			return fail("Best-of needs a number from 1 to 99.");
		}

		const firstTo = numbered(text, /first\s*to\s*(\d+)/);
		if (firstTo) {
			return ok({
				type: "first-to",
				target: firstTo,
				label: `First to ${firstTo}`,
			});
		}
		if (/first\s*to/.test(text)) {
			return fail("First-to needs a number from 1 to 99.");
		}

		const rounds = numbered(text, /(\d+)\s*rounds?/) || numbered(text, /^(\d+)$/);
		if (rounds) {
			return ok({
				type: "rounds",
				length: rounds,
				label: `${rounds} round${rounds === 1 ? "" : "s"}`,
			});
		}

		return fail("Try “best of 5”, “10 rounds”, or “first to 3”.");
	};

	const showScreen = (name) => {
		document.body.dataset.screen = name;
		[els.setup, els.play, els.over].forEach((screen) => {
			const active = screen.id === `${name}-screen`;
			screen.classList.toggle("is-active", active);
			screen.hidden = !active;
			screen.inert = !active;
			screen.setAttribute("aria-hidden", active ? "false" : "true");
		});
	};

	const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);

	const waitingMark = () => el("span", { className: "waiting", textContent: "?" });

	const choiceImage = (choice) =>
		el("img", {
			src: ASSETS[choice],
			alt: choice,
			draggable: false,
		});

	const setArt = (node, choice) => {
		node.replaceChildren(choice ? choiceImage(choice) : waitingMark());
	};

	const setStatus = (text, kind = "") => {
		els.status.className = kind ? `status ${kind}` : "status";
		els.status.textContent = text;
	};

	const clearPedestals = () => {
		[els.playerPedestal, els.computerPedestal].forEach((node) => {
			node.classList.remove("is-win", "is-lose");
		});
	};

	const resetArena = () => {
		setArt(els.playerArt);
		setArt(els.computerArt);
		clearPedestals();
		setStatus("Choose your move");
	};

	const roundCaption = () => {
		const { match, round } = state;
		if (match.type === "rounds") {
			return `Round ${Math.min(round + 1, match.length)} of ${match.length}`;
		}
		if (match.type === "best-of") {
			return `First to ${match.target} · Round ${round + 1}`;
		}
		return `Round ${round + 1}`;
	};

	const renderScore = () => {
		els.playerScore.textContent = String(state.playerScore);
		els.computerScore.textContent = String(state.computerScore);
		els.matchLabel.textContent = state.match.label;
		els.roundLabel.textContent = roundCaption();
	};

	const renderHistory = () => {
		els.history.replaceChildren(
			...state.history.map((item) =>
				el("li", {
					textContent: `${capitalize(item.player)} vs ${capitalize(item.computer)} · ${RESULT_WORD[item.outcome]}`,
				}),
			),
		);
	};

	const setChoicesLocked = (locked) => {
		state.locked = locked;
		$$(".choice", els.choices).forEach((button) => {
			button.classList.toggle("is-disabled", locked);
			button.disabled = locked;
		});
	};

	const canvasFor = (img) => {
		const cached = hitCache.get(img.src);
		if (cached) {
			return cached;
		}

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		const record = { canvas, ctx, ready: false };
		const paint = () => {
			if (!img.naturalWidth) {
				return;
			}
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0);
			record.ready = true;
		};

		if (img.complete) {
			paint();
		} else {
			img.addEventListener("load", paint, { once: true });
		}

		hitCache.set(img.src, record);
		return record;
	};

	const isOpaquePoint = (img, event) => {
		const record = canvasFor(img);
		if (!record.ready) {
			return true;
		}

		const rect = img.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) {
			return false;
		}

		const x = Math.floor((event.clientX - rect.left) * (record.canvas.width / rect.width));
		const y = Math.floor((event.clientY - rect.top) * (record.canvas.height / rect.height));
		if (x < 0 || y < 0 || x >= record.canvas.width || y >= record.canvas.height) {
			return false;
		}

		try {
			return record.ctx.getImageData(x, y, 1, 1).data[3] > 24;
		} catch {
			return true;
		}
	};

	const delay = (ms) =>
		new Promise((resolve) => {
			state.timer = window.setTimeout(resolve, prefersReducedMotion() ? 0 : ms);
		});

	const compare = (player, computer) => {
		if (player === computer) {
			return "draw";
		}
		return BEATS[player] === computer ? "win" : "lose";
	};

	const outcomeCopy = (player, computer, outcome) => {
		if (outcome === "draw") {
			return `Both played ${player}. Draw.`;
		}
		if (outcome === "win") {
			return `${capitalize(player)} ${VERB[player]} ${computer}. You win the round.`;
		}
		return `${capitalize(computer)} ${VERB[computer]} ${player}. Computer wins the round.`;
	};

	const matchOver = () => {
		if (state.match.type === "rounds") {
			return state.round >= state.match.length;
		}
		return state.playerScore >= state.match.target || state.computerScore >= state.match.target;
	};

	const startMatch = (match) => {
		window.clearTimeout(state.timer);
		state.match = match;
		state.playerScore = 0;
		state.computerScore = 0;
		state.round = 0;
		state.history = [];
		els.error.textContent = "";
		showScreen("play");
		resetArena();
		renderScore();
		renderHistory();
		setChoicesLocked(false);
	};

	const tryStart = (spec, showError = false) => {
		const parsed = parseMatchSpec(spec);
		if (!parsed.ok) {
			if (showError) {
				els.error.textContent = parsed.message;
				els.input.focus();
			}
			return;
		}
		startMatch(parsed.match);
	};

	const finishMatch = () => {
		const playerWon = state.playerScore > state.computerScore;
		const tied = state.playerScore === state.computerScore;
		const label = state.match.label.toLowerCase();

		els.overKicker.textContent = "Match over";
		els.finalScore.textContent = `${state.playerScore} - ${state.computerScore}`;

		if (tied) {
			els.overTitle.textContent = "The table stays even";
			els.overCopy.textContent = `Nobody took ${label}.`;
		} else if (playerWon) {
			els.overTitle.textContent = "You take the table";
			els.overCopy.textContent = `You won ${label}.`;
		} else {
			els.overTitle.textContent = "The computer holds the table";
			els.overCopy.textContent = `CPU won ${label}.`;
		}

		showScreen("over");
	};

	const applyOutcome = (outcome) => {
		clearPedestals();
		if (outcome === "win") {
			state.playerScore += 1;
			els.playerPedestal.classList.add("is-win");
			els.computerPedestal.classList.add("is-lose");
			return;
		}
		if (outcome === "lose") {
			state.computerScore += 1;
			els.computerPedestal.classList.add("is-win");
			els.playerPedestal.classList.add("is-lose");
		}
	};

	const playRound = async (playerChoice) => {
		if (state.locked || !state.match) {
			return;
		}

		setChoicesLocked(true);
		setArt(els.playerArt, playerChoice);
		setArt(els.computerArt);
		setStatus("Computer is choosing…");

		const shuffleSteps = prefersReducedMotion() ? 1 : 6;
		for (let i = 0; i < shuffleSteps; i += 1) {
			setArt(els.computerArt, CHOICES[i % CHOICES.length]);
			await delay(THINK_MS / shuffleSteps);
		}

		const computerChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
		setArt(els.computerArt, computerChoice);

		const outcome = compare(playerChoice, computerChoice);
		applyOutcome(outcome);
		setStatus(outcomeCopy(playerChoice, computerChoice, outcome), `is-${outcome}`);
		state.round += 1;
		state.history.push({ player: playerChoice, computer: computerChoice, outcome });
		renderScore();
		renderHistory();

		await delay(HOLD_MS);
		if (matchOver()) {
			finishMatch();
			return;
		}

		resetArena();
		renderScore();
		setChoicesLocked(false);
	};

	const choiceFromEvent = (event, button) => {
		const img = $("img", button);
		if (event.target === img && !isOpaquePoint(img, event)) {
			return null;
		}
		return button.dataset.choice;
	};

	const updateHotChoice = (event) => {
		$$(".choice", els.choices).forEach((choice) => {
			const img = $("img", choice);
			const hot =
				!state.locked &&
				event.target === img &&
				event.target.closest(".choice") === choice &&
				isOpaquePoint(img, event);
			choice.classList.toggle("is-hot", hot);
		});
	};

	const clearHotChoices = () => {
		$$(".choice.is-hot", els.choices).forEach((choice) => {
			choice.classList.remove("is-hot");
		});
	};

	const goToSetup = () => {
		window.clearTimeout(state.timer);
		setChoicesLocked(false);
		showScreen("setup");
		els.input.focus();
	};

	on(els.setup, "click", ".mode-card", (event, card) => {
		tryStart(card.dataset.spec);
	});

	els.form.addEventListener("submit", (event) => {
		event.preventDefault();
		tryStart(els.input.value, true);
	});

	on(els.choices, "click", ".choice", (event, button) => {
		const choice = choiceFromEvent(event, button);
		if (choice) {
			playRound(choice);
		}
	});

	els.choices.addEventListener("mousemove", updateHotChoice);
	els.choices.addEventListener("mouseleave", clearHotChoices);

	on(els.over, "click", "button", (event, button) => {
		if (button.id === "play-again") {
			startMatch(state.match);
			return;
		}
		if (button.id === "new-match") {
			goToSetup();
		}
	});

	document.addEventListener("keydown", (event) => {
		if (event.target === els.input) {
			return;
		}
		const choice = KEYS[event.key.toLowerCase()];
		if (!choice || els.play.hidden) {
			return;
		}
		event.preventDefault();
		playRound(choice);
	});

	$$("img", els.choices).forEach(canvasFor);
	showScreen("setup");
})();

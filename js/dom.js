(() => {
	"use strict";

	const fromEvent = (event, selector) => {
		if (!selector) {
			return event.currentTarget;
		}

		const node = event.target;
		if (!(node instanceof Element)) {
			return null;
		}

		return node.closest(selector);
	};

	window.dom = {
		byId(id) {
			return document.getElementById(id);
		},
		$(selector, root = document) {
			return root.querySelector(selector);
		},
		$$(selector, root = document) {
			return [...root.querySelectorAll(selector)];
		},
		on(root, type, selector, handler) {
			root.addEventListener(type, (event) => {
				const match = fromEvent(event, selector);
				if (!match || !root.contains(match)) {
					return;
				}
				handler(event, match);
			});
		},
	};
})();

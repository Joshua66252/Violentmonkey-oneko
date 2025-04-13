// ==UserScript==
// @name        oneko
// @namespace   oneko
// @match       *://*/*
// @grant       none
// @version     1.0
// @author      adryd325, kyrie25, Joshua66252
// @description cat follow mouse real.
// @resource    classic    https://raw.githubusercontent.com/Joshua66252/Violentmonkey-oneko/refs/heads/main/assets/oneko/oneko-classic.gif
// @resource    dog        https://raw.githubusercontent.com/Joshua66252/Violentmonkey-oneko/refs/heads/main/assets/oneko/oneko-dog.gif
// @resource    tora       https://raw.githubusercontent.com/Joshua66252/Violentmonkey-oneko/refs/heads/main/assets/oneko/oneko-maia.gif
// @resource    maia       https://raw.githubusercontent.com/Joshua66252/Violentmonkey-oneko/refs/heads/main/assets/oneko/oneko-tora.gif
// @resource    vaporwave  https://raw.githubusercontent.com/Joshua66252/Violentmonkey-oneko/refs/heads/main/assets/oneko/oneko-vaporwave.gif
// @grant       GM_getResourceURL
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==

/* 
oneko.js: https://github.com/adryd325/oneko.js
oneko spicetify: https://github.com/kyrie25/spicetify-oneko

TODO:
HIDE/UNHIDE
RUN ON AND OFF SCREEN WHEN HIDDEN/UNHIDDEN AND CHANGING VARIANT
*/




(function oneko() {

	const nekoEl = document.createElement("div");

	let nekoPosX = 32,
		nekoPosY = 32,
		mousePosX = 0,
		mousePosY = 0,
		frameCount = 0,
		idleTime = 0,
		idleAnimation = null,
		idleAnimationFrame = 0,
		grabbing = false,
		grabStop = true,
		nudge = false,
		kuroNeko = GM_getValue("kuro") || false,
		variant = GM_getValue("variant") || null,
		startX = 0,
		startY = 0,
		startNekoX = 0,
		startNekoY = 0,
		pickerModalOpen = false,
		grabInterval;
	const nekoSpeed = 10,
		variants = [
			[
				GM_getResourceURL("classic", true),
				"Classic"
			],
			[
				GM_getResourceURL("dog", true),
				"Dog"

			],
			[
				GM_getResourceURL("tora", true),
				"Tora"

			],
			[
				GM_getResourceURL("maia", true),
				"Maia (maia.crimew.gay)"
			],
			[
				GM_getResourceURL("vaporwave", true),
				"Vaporwave (nya.rest)"
			],
		],
		spriteSets = {
			idle: [
				[-3, -3]
			],
			alert: [
				[-7, -3]
			],
			scratchSelf: [
				[-5, 0],
				[-6, 0],
				[-7, 0],
			],
			scratchWallN: [
				[0, 0],
				[0, -1],
			],
			scratchWallS: [
				[-7, -1],
				[-6, -2],
			],
			scratchWallE: [
				[-2, -2],
				[-2, -3],
			],
			scratchWallW: [
				[-4, 0],
				[-4, -1],
			],
			tired: [
				[-3, -2]
			],
			sleeping: [
				[-2, 0],
				[-2, -1],
			],
			N: [
				[-1, -2],
				[-1, -3],
			],
			NE: [
				[0, -2],
				[0, -3],
			],
			E: [
				[-3, 0],
				[-3, -1],
			],
			SE: [
				[-5, -1],
				[-5, -2],
			],
			S: [
				[-6, -3],
				[-7, -2],
			],
			SW: [
				[-5, -3],
				[-6, -1],
			],
			W: [
				[-4, -2],
				[-4, -3],
			],
			NW: [
				[-1, 0],
				[-1, -1],
			],
		};

	function init() {
		nekoEl.id = "oneko";
		nekoEl.ariaHidden = true;
		nekoEl.style.width = "32px";
		nekoEl.style.height = "32px";
		nekoEl.style.position = "fixed";
		nekoEl.style.imageRendering = "pixelated";
		nekoEl.style.left = `${nekoPosX - 16}px`;
		nekoEl.style.top = `${nekoPosY - 16}px`;
		nekoEl.style.zIndex = 2147483647;

		if (variant == null) {
			variant = 0;
		}
		setVariant(variant);

		document.body.appendChild(nekoEl);

		document.addEventListener("mousemove", function(event) {
			mousePosX = event.clientX;
			mousePosY = event.clientY;
			if (grabbing) {
				const deltaX = event.clientX - startX;
				const deltaY = event.clientY - startY;
				const absDeltaX = Math.abs(deltaX);
				const absDeltaY = Math.abs(deltaY);

				// Scratch in the opposite direction of the drag
				if (absDeltaX > absDeltaY && absDeltaX > 10) {
					setSprite(deltaX > 0 ? "scratchWallW" : "scratchWallE", frameCount);
				} else if (absDeltaY > absDeltaX && absDeltaY > 10) {
					setSprite(deltaY > 0 ? "scratchWallN" : "scratchWallS", frameCount);
				}

				if (grabStop || absDeltaX > 10 || absDeltaY > 10 || Math.sqrt(deltaX ** 2 + deltaY ** 2) > 10) {
					grabStop = false;
					clearTimeout(grabInterval);
					grabInterval = setTimeout(() => {
						grabStop = true;
						nudge = false;
						startX = event.clientX;
						startY = event.clientY;
						startNekoX = nekoPosX;
						startNekoY = nekoPosY;
					}, 150);
				}

				nekoPosX = startNekoX + event.clientX - startX;
				nekoPosY = startNekoY + event.clientY - startY;
				nekoEl.style.left = `${nekoPosX - 16}px`;
				nekoEl.style.top = `${nekoPosY - 16}px`;
			}
		});

		// Handle dragging of the cat
		nekoEl.addEventListener("mousedown", (event) => {
			if (event.button !== 0) return;
			grabbing = true;
			startX = event.clientX;
			startY = event.clientY;
			startNekoX = nekoPosX;
			startNekoY = nekoPosY;

			const mouseup = () => {
				grabbing = false;
				nudge = true;
				resetIdleAnimation();
				window.removeEventListener("mouseup", mouseup);
			};

			window.addEventListener("mouseup", mouseup);
		});

		nekoEl.addEventListener("contextmenu", (event) => {
			event.preventDefault();
			pickerModal();
		});

		window.requestAnimationFrame(onAnimationFrame);
	}

	function setVariant(newVariant) {
		variant = newVariant;
		nekoEl.style.backgroundImage = `url(${variants[newVariant][0]})`;
		nekoEl.style.filter = kuroNeko ? "invert(100%)" : "none";
		GM_setValue("variant", variant);
		GM_setValue("kuro", kuroNeko);
	}

	let lastFrameTimestamp;

	function onAnimationFrame(timestamp) {
		// Stops execution if the neko element is removed from DOM
		if (!nekoEl.isConnected) {
			return;
		}
		if (!lastFrameTimestamp) {
			lastFrameTimestamp = timestamp;
		}
		if (timestamp - lastFrameTimestamp > 100) {
			lastFrameTimestamp = timestamp
			frame()
		}
		window.requestAnimationFrame(onAnimationFrame);
	}

	function getSprite(name, frame) {
		return spriteSets[name][frame % spriteSets[name].length];
	}

	function setSprite(name, frame) {
		const sprite = getSprite(name, frame);
		nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
	}

	function resetIdleAnimation() {
		idleAnimation = null;
		idleAnimationFrame = 0;
	}

	function idle() {
		idleTime += 1;

		// every ~ 20 seconds
		if (
			idleTime > 10 &&
			Math.floor(Math.random() * 200) == 0 &&
			idleAnimation == null
		) {
			let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
			if (nekoPosX < 32) {
				avalibleIdleAnimations.push("scratchWallW");
			}
			if (nekoPosY < 32) {
				avalibleIdleAnimations.push("scratchWallN");
			}
			if (nekoPosX > window.innerWidth - 32) {
				avalibleIdleAnimations.push("scratchWallE");
			}
			if (nekoPosY > window.innerHeight - 32) {
				avalibleIdleAnimations.push("scratchWallS");
			}
			idleAnimation =
				avalibleIdleAnimations[
					Math.floor(
						Math.random() * avalibleIdleAnimations.length
					)
				];
		}

		switch (idleAnimation) {
			case "sleeping":
				if (nudge) {
					nudge = false;
					resetIdleAnimation();
				}
				if (idleAnimationFrame < 8) {
					setSprite("tired", 0);
					break;
				}
				setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
				if (idleAnimationFrame > 192) {
					resetIdleAnimation();
				}
				break;
			case "scratchWallN":
			case "scratchWallS":
			case "scratchWallE":
			case "scratchWallW":
			case "scratchSelf":
				setSprite(idleAnimation, idleAnimationFrame);
				if (idleAnimationFrame > 9) {
					resetIdleAnimation();
				}
				break;
			default:
				setSprite("idle", 0);
				return;
		}
		idleAnimationFrame += 1;
	}

	function frame() {
		frameCount += 1;

		if (grabbing) {
			grabStop && setSprite("alert", 0);
			return;
		}

		const diffX = nekoPosX - mousePosX;
		const diffY = nekoPosY - mousePosY;
		const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

		if (distance < nekoSpeed || distance < 48) {
			idle();
			return;
		}

		idleAnimation = null;
		idleAnimationFrame = 0;

		if (idleTime > 1) {
			setSprite("alert", 0);
			// count down after being alerted before moving
			idleTime = Math.min(idleTime, 7);
			idleTime -= 1;
			return;
		}

		let direction;
		direction = diffY / distance > 0.5 ? "N" : "";
		direction += diffY / distance < -0.5 ? "S" : "";
		direction += diffX / distance > 0.5 ? "W" : "";
		direction += diffX / distance < -0.5 ? "E" : "";
		setSprite(direction, frameCount);

		nekoPosX -= (diffX / distance) * nekoSpeed;
		nekoPosY -= (diffY / distance) * nekoSpeed;

		nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
		nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

		nekoEl.style.left = `${nekoPosX - 16}px`;
		nekoEl.style.top = `${nekoPosY - 16}px`;
	}

	// Popup modal to choose variant
	function pickerModal() {
		if (pickerModalOpen) {
			let containerArray = document.body.getElementsByClassName("oneko-variant-container");
			if (containerArray.length > 0) {
				containerArray[0].remove();
			}
			pickerModalOpen = false;
			return;
		}
		pickerModalOpen = true;
		const container = document.createElement("div");
		container.className = "oneko-variant-container";

		const style = document.createElement("style");
		// Each variant is a 64x64 sprite
		style.innerHTML = `
      .oneko-variant-container {
      	position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        background: #202020;
        border-radius: 1em;
        border-width: 2em;
        border-color: #202020;
      }
      .oneko-variant-button {
        width: 64px;
        height: 64px;
        margin: 8px;
        cursor: pointer;
        background-size: 800%;
        border-radius: 25%;
        transition: background-color 0.2s ease-in-out;
        background-position: var(--idle-x) var(--idle-y);
        image-rendering: pixelated;
      }
      .oneko-variant-text {
      	margin-top: 85%;
      }
      .oneko-variant-button:hover, .oneko-variant-button-selected {
        background-color: var(--spice-main-elevated);
      }
      .oneko-variant-button:hover {
        background-position: var(--active-x) var(--active-y);
      }
    `;
		container.appendChild(style);

		const idle = getSprite("idle", 0),
			active = getSprite("alert", 0);

		function variantButton(variantArray, kuro) {
			const div = document.createElement("div");

			div.className = "oneko-variant-button";
			div.title = variantArray[1];
			div.style.backgroundImage = `url(${variantArray[0]})`;
			div.style.setProperty("--idle-x", `${idle[0] * 64}px`);
			div.style.setProperty("--idle-y", `${idle[1] * 64}px`);
			div.style.setProperty("--active-x", `${active[0] * 64}px`);
			div.style.setProperty("--active-y", `${active[1] * 64}px`);
			if (kuro) {
				div.title = `Kuro ${div.title}`;
				div.style.filter = "invert(100%)";
			}
			div.onclick = () => {
				kuroNeko = kuro
				setVariant(variants.indexOf(variantArray));
				pickerModalOpen = false;
				container.remove();
			};

			if (variantArray == variant && kuro == kuroNeko) {
				div.classList.add("oneko-variant-button-selected");
			}

			return div;
		}

		for (const variant of variants) {
			container.appendChild(variantButton(variant, false));
			container.appendChild(variantButton(variant, true));
		}

		document.body.appendChild(container);
	}

	init();
})();

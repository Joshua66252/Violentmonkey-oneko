// oneko.js: https://github.com/adryd325/oneko.js

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
    forceSleep = false,
    kuroNeko = false,
    variant = "classic";

  function parseLocalStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(`oneko:${key}`));
      console.log(key, value);
      return typeof value === typeof fallback ? value : fallback;
    } catch (e) {
      console.error(e);
      return fallback;
    }
  }

  const nekoSpeed = 10,
    variants = [
      ["classic", "Classic"],
      ["dog", "Dog"],
      ["tora", "Tora"],
    ],
    spriteSets = {
      idle: [[-3, -3]],
      alert: [[-7, -3]],
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
      tired: [[-3, -2]],
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

  function create() {
    variant = parseLocalStorage("variant", "classic");
    kuroNeko = parseLocalStorage("kuroneko", false);

    nekoEl.id = "oneko";
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    // nekoEl.style.pointerEvents = "none";
    nekoEl.style.backgroundImage = `url('https://raw.githubusercontent.com/kyrie25/spicetify-oneko/main/assets/oneko/oneko-${variant}.gif')`;
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.filter = kuroNeko ? "invert(100%)" : "none";
    // Still wondering whether or not to cover the popup modal (which has z-index 100 or 9999)
    nekoEl.style.zIndex = "999";

    document.body.appendChild(nekoEl);

    document.onmousemove = (event) => {
      if (forceSleep) return;

      mousePosX = event.clientX;
      mousePosY = event.clientY;
    };

    nekoEl.oncontextmenu = (e) => {
      e.preventDefault();
      kuroNeko = !kuroNeko;
      localStorage.setItem("oneko:kuroneko", kuroNeko);
      nekoEl.style.filter = kuroNeko ? "invert(100%)" : "none";
    };

    nekoEl.ondblclick = () => {
      forceSleep = !forceSleep;
      if (!forceSleep) {
        resetIdleAnimation();
        return;
      }

      // Get the far right and top of the progress bar
      const progressBar = document.querySelector(
        ".main-nowPlayingBar-center .playback-progressbar"
      );
      const progressBarRight = progressBar.getBoundingClientRect().right;
      const progressBarTop = progressBar.getBoundingClientRect().top;

      // Make the cat sleep on the progress bar
      mousePosX = progressBarRight - 16;
      mousePosY = progressBarTop - 8;

      // Get the position of the remaining time
      const remainingTime = document.querySelector(
        ".main-playbackBarRemainingTime-container"
      );
      const remainingTimeLeft = remainingTime.getBoundingClientRect().left;
      const remainingTimeBottom = remainingTime.getBoundingClientRect().bottom;

      // Get the position of elapsed time
      const elapsedTime = document.querySelector(
        ".playback-bar__progress-time-elapsed"
      );
      const elapsedTimeRight = elapsedTime.getBoundingClientRect().right;
      const elapsedTimeLeft = elapsedTime.getBoundingClientRect().left;

      // If the remaining time is on top right of the progress bar, make the cat sleep to the a little bit to the left of the remaining time
      // Theme compatibility
      if (
        remainingTimeLeft < progressBarRight &&
        remainingTimeBottom - progressBarTop < 32
      ) {
        mousePosX = remainingTimeLeft - 16;

        // Comfy special case
        if (Spicetify.Config.current_theme === "Comfy") {
          mousePosY = progressBarTop - 14;
        }

        // Move the cat to the left of elapsed time if it is too close to the remaining time (Nord theme)
        if (remainingTimeLeft - elapsedTimeRight < 32) {
          mousePosX = elapsedTimeLeft - 16;
        }
      }
    };

    window.onekoInterval = setInterval(frame, 100);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
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
      if (forceSleep) {
        avalibleIdleAnimations = ["sleeping"];
      }
      idleAnimation =
        avalibleIdleAnimations[
          Math.floor(Math.random() * avalibleIdleAnimations.length)
        ];
    }

    if (forceSleep) {
      idleAnimation = "sleeping";
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192 && !forceSleep) {
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
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    // Cat has to sleep on top of the progress bar
    if (
      forceSleep &&
      Math.abs(diffY) < nekoSpeed &&
      Math.abs(diffX) < nekoSpeed
    ) {
      // Move the cat to the left if it is sleeping too far to the right
      if (nekoPosX > mousePosX) {
        nekoPosX -= nekoSpeed;
        return;
      }

      // Make the cat sleep exactly on the top of the progress bar
      nekoPosX = mousePosX;
      nekoPosY = mousePosY;
      nekoEl.style.left = `${nekoPosX - 16}px`;
      nekoEl.style.top = `${nekoPosY - 16}px`;

      idle();
      return;
    }

    if ((distance < nekoSpeed || distance < 48) && !forceSleep) {
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

  create();

  function setVariant(arr) {
    console.log(arr);

    variant = arr[0];
    localStorage.setItem("oneko:variant", `"${variant}"`);
    nekoEl.style.backgroundImage = `url('https://raw.githubusercontent.com/kyrie25/spicetify-oneko/main/assets/oneko/oneko-${variant}.gif')`;
  }

  // Popup modal to choose variant
  function pickerModal() {
    const container = document.createElement("div");
    container.className = "oneko-variant-container";

    const style = document.createElement("style");
    // Each variant is a 64x64 sprite
    style.innerHTML = `
      .oneko-variant-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
      }
      .oneko-variant-button {
        width: 64px;
        height: 64px;
        margin: 8px;
        cursor: pointer;
        background-size: 800%;
        border-radius: 25%;
      }
      .oneko-variant-button:hover, .oneko-variant-button-selected {
        background-position: ${-2 * 32}px ${-2 * 32}px;
        background-color: var(--spice-main-elevated);
      }
    `;
    container.appendChild(style);

    function variantButton(variantEnum) {
      const div = document.createElement("div");
      div.className = "oneko-variant-button";
      div.id = variantEnum[0];
      div.style.backgroundImage = `url('https://raw.githubusercontent.com/kyrie25/spicetify-oneko/main/assets/oneko/oneko-${variantEnum[0]}.gif')`;
      div.onclick = () => {
        setVariant(variantEnum);
        const selected = document.querySelector(
          ".oneko-variant-button-selected"
        );
        if (selected) {
          selected.classList.remove("oneko-variant-button-selected");
        }
        div.className += " oneko-variant-button-selected";
      };
      if (variantEnum[0] === variant) {
        div.className += " oneko-variant-button-selected";
      }

      Spicetify.Tippy(div, {
        ...Spicetify.TippyProps,
        content: variantEnum[1],
      });

      return div;
    }

    for (const variant of variants) {
      container.appendChild(variantButton(variant));
    }

    return container;
  }

  Spicetify.Mousetrap.bind("o n e k o", () => {
    Spicetify.PopupModal.display({
      title: "Choose your neko",
      // Render the modal new every time it is opened
      content: pickerModal(),
    });
  });
})();

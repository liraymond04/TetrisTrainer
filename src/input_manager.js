import { Direction, GameState } from "./constants.js";
import {
  GetIsPaused,
  G_FastForward,
  G_Quit,
  G_Restart,
  G_Rewind,
  G_StartPause,
  G_GetGameState,
  G_MoveCurrentPieceDown,
  G_MovePieceRight,
  G_MovePieceLeft,
  G_RotatePieceLeft,
  G_RotatePieceRight,
} from "./index.js";
const GameSettings = require("./game_settings_manager");
const keyEditPopup = document.getElementById("edit-key");

const DEFAULT_KEY_MAP = {
  RESTART: "r",
  REWIND: "v",
  FAST_FORWARD: "b",
  START_PAUSE: "Enter",
  QUIT: "q",
  ROTATE_LEFT: "z",
  ROTATE_RIGHT: "x",
  LEFT: "ArrowLeft",
  DOWN: "ArrowDown",
  RIGHT: "ArrowRight",
};

let KEY_MAP = DEFAULT_KEY_MAP;

const DEFAULT_GAMEPAD_MAP = {
  RESTART: "button-8",
  REWIND: "",
  FAST_FORWARD: "",
  START_PAUSE: "button-9",
  QUIT: "",
  ROTATE_LEFT: "button-0",
  ROTATE_RIGHT: "button-1",
  LEFT: "axis-0:-1",
  DOWN: "axis-1:1",
  RIGHT: "axis-0:1",
};

let GAMEPAD_MAP = [];

let GAMEPAD = [];
let GAMEPAD_PREV_STATE = [];

const idToKeyMap = [
  ["key-rot-left", "ROTATE_LEFT"],
  ["key-rot-right", "ROTATE_RIGHT"],
  ["key-left", "LEFT"],
  ["key-right", "RIGHT"],
  ["key-down", "DOWN"],
  ["key-start-pause", "START_PAUSE"],
  ["key-restart", "RESTART"],
  ["key-undo", "REWIND"],
  ["key-redo", "FAST_FORWARD"],
  ["key-quit", "QUIT"],
];

export function InputManager() {
  this.getKeyMapFromCookie();
  this.resetLocalVariables();
  this.addKeyClickListeners();
}

/* ---------------------
    Key Editing UI
---------------------- */

InputManager.prototype.saveKeyMapToCookie = function () {
  document.cookie =
    "keymap=" +
    escape(JSON.stringify(KEY_MAP)) +
    "; expires=Thu, 18 Dec 2030 12:00:00 UTC";
  console.log("saved new cookie:", document.cookie);
};

InputManager.prototype.getKeyMapFromCookie = function () {
  if (document.cookie) {
    const keyMapCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("keymap="));
    if (keyMapCookie) {
      const keyMapCookieVal = keyMapCookie.split("=")[1];
      KEY_MAP = JSON.parse(unescape(keyMapCookieVal));
      this.refreshKeyVisuals();
    }
  }
};

InputManager.prototype.addKeyClickListeners = function () {
  for (const [id, key] of idToKeyMap) {
    document.getElementById(id).addEventListener("click", () => {
      this.keyBeingEdited = key;
      keyEditPopup.style.visibility = "visible";
    });
  }
};

// Nice lookig
const CUSTOM_KEY_DISPLAYS = {
  ArrowLeft: "←",
  ArrowDown: "↓",
  ArrowRight: "→",
};

InputManager.prototype.refreshKeyVisuals = function () {
  for (const [id, key] of idToKeyMap) {
    const rawKey = KEY_MAP[key];
    document.getElementById(id).innerHTML =
      CUSTOM_KEY_DISPLAYS[rawKey] || rawKey.toUpperCase();
  }
};

/* ---------------------
    Called by parent
---------------------- */

InputManager.prototype.getIsSoftDropping = function () {
  return this.isSoftDropping;
};

InputManager.prototype.getCellsSoftDropped = function () {
  return this.cellSoftDropped;
};

InputManager.prototype.onPieceLock = function () {
  if (GameSettings.shouldSetDASChargeOnPieceStart()) {
    this.setDASCharge(GameSettings.getDASWallChargeAmount());
  } else {
    // Don't allow DAS charges higher than the wall charge amount.
    // This is used on DAS speeds with higher ARR but intentionally handicapped starting charges
    this.setDASCharge(
      Math.min(GameSettings.getDASWallChargeAmount(), this.dasCharge),
    );
  }
};

InputManager.prototype.resetLocalVariables = function () {
  this.leftHeld = false;
  this.rightHeld = false;
  this.downHeld = false;
  this.isSoftDropping = false;
  this.cellSoftDropped = 0;
  this.dasCharge = GameSettings.getDASTriggerThreshold(); // Starts charged on the first piece
  this.softDroppedLastFrame = false;
  this.keyBeingEdited = null;
};

InputManager.prototype.handleInputsThisFrame = function () {
  // If holding multiple keys, do nothing
  const dpadDirectionsHeld = this.downHeld + this.leftHeld + this.rightHeld;
  if (dpadDirectionsHeld > 1) {
    this.isSoftDropping = false;
    this.cellSoftDropped = 0;
    return;
  }

  // Move piece down
  if (this.isSoftDropping && !this.softDroppedLastFrame) {
    const didMove = G_MoveCurrentPieceDown();
    if (didMove) {
      this.cellSoftDropped += 1;
    } else {
      // If it didn't move, then it locked in. Reset soft drop between pieces.
      this.isSoftDropping = false;
      this.cellSoftDropped = 0;
    }
    this.softDroppedLastFrame = true;
    return;
  } else {
    this.softDroppedLastFrame = false;
  }

  // DAS left
  if (this.leftHeld) {
    this.handleHeldDirection(Direction.LEFT);
    return;
  }

  // DAS right
  if (this.rightHeld) {
    this.handleHeldDirection(Direction.RIGHT);
  }
};

/* ---------------------
    Key listeners 
---------------------- */

InputManager.prototype.keyDownListener = function (event) {
  // Override the browser's built-in key repeating
  if (event.repeat) {
    event.preventDefault();
    return;
  }

  if (this.keyBeingEdited) {
    KEY_MAP[this.keyBeingEdited] = event.key;
    this.keyBeingEdited = null;
    keyEditPopup.style.visibility = "hidden";
    this.refreshKeyVisuals();
    this.saveKeyMapToCookie();
  }

  // Handle global shortcuts
  switch (event.key) {
    case KEY_MAP.RESTART:
      G_Restart();
      break;

    case KEY_MAP.REWIND:
      G_Rewind();
      break;

    case KEY_MAP.FAST_FORWARD:
      G_FastForward();
      break;

    case KEY_MAP.START_PAUSE:
      G_StartPause();
      break;

    case KEY_MAP.QUIT:
      G_Quit();
      break;
  }

  // Track whether keys are held regardless of state
  switch (event.key) {
    case KEY_MAP.LEFT:
      this.leftHeld = true;
      event.preventDefault();
      break;
    case KEY_MAP.RIGHT:
      this.rightHeld = true;
      event.preventDefault();
      break;
    case KEY_MAP.DOWN:
      this.downHeld = true;
      event.preventDefault();
      break;
  }

  // Only actually move the pieces if in the proper game state
  const gameState = G_GetGameState();
  if (canMovePiecesSidewaysOrRotate(gameState)) {
    switch (event.key) {
      case KEY_MAP.LEFT:
        this.handleTappedDirection(Direction.LEFT);
        break;
      case KEY_MAP.RIGHT:
        this.handleTappedDirection(Direction.RIGHT);
        break;
      case KEY_MAP.ROTATE_LEFT:
        G_RotatePieceLeft();
        break;
      case KEY_MAP.ROTATE_RIGHT:
        G_RotatePieceRight();
        break;
    }
  } else {
    switch (event.key) {
      case KEY_MAP.ROTATE_LEFT:
        console.log("rotate rejected, state: ", G_GetGameState());
        break;
      case KEY_MAP.ROTATE_RIGHT:
        console.log("rotate rejected, state: ", G_GetGameState());
        break;
    }
  }

  if (canDoAllPieceMovements(gameState)) {
    switch (event.key) {
      case KEY_MAP.DOWN:
        this.isSoftDropping = true;
        break;
    }
  }
};

InputManager.prototype.keyUpListener = function (event) {
  // Track whether keys are held regardless of state
  if (event.key == KEY_MAP.LEFT) {
    this.leftHeld = false;
  } else if (event.key == KEY_MAP.RIGHT) {
    this.rightHeld = false;
  } else if (event.key == KEY_MAP.DOWN) {
    this.downHeld = false;
    this.isSoftDropping = false; // Can stop soft dropping in any state
    this.cellSoftDropped = 0;
  }
};

/* ---------------------
    Gamepad State
---------------------- */

function getKeyFromId(id) {
  const foundItem = idToKeyMap.find(([keyId]) => id === keyId);
  return foundItem ? foundItem[1] : null;
}

InputManager.prototype.createControlsContainer = function (
  index,
  controllerName,
) {
  let existingControls = document.getElementById("controls-container");
  let clonedControls = existingControls.cloneNode(true);
  clonedControls.id = "controls-container-" + index;

  let bodyInner = document.getElementById("body-inner");

  let containerLabel = document.createElement("div");
  let gamepadName = document.createElement("div");
  let gamepadStatus = document.createElement("div");
  containerLabel.appendChild(gamepadName);
  containerLabel.appendChild(gamepadStatus);

  containerLabel.className = "gamepad-container-label";
  gamepadName.innerHTML = controllerName;

  gamepadStatus.id = `gamepad-${index}-status`;
  gamepadStatus.className = "gamepad-status-connected";
  gamepadStatus.innerHTML = "Connected";

  let elements = clonedControls.getElementsByClassName("key-explanation");
  for (var i = 0; i < elements.length; i++) {
    let item = elements.item(i);
    if (item.innerHTML === "Edit board") {
      let parentElement = item.parentNode;
      let grandparentElement = parentElement.parentNode;
      grandparentElement.removeChild(parentElement);
    }
  }

  bodyInner.appendChild(containerLabel);
  bodyInner.appendChild(clonedControls);

  this.changeInnerElementIds(clonedControls, index);
};

InputManager.prototype.changeInnerElementIds = function (
  container,
  gamepadIndex,
) {
  let cur = this;
  let innerElements = container.querySelectorAll('[id^="key-"]');
  innerElements.forEach(function (element) {
    let originalId = element.id;
    element.id = "gamepad-" + gamepadIndex + "-" + originalId;
    let key = getKeyFromId(originalId);
    element.innerHTML = GAMEPAD_MAP[gamepadIndex][key];

    document.getElementById(element.id).addEventListener("click", () => {
      cur.keyBeingEdited = key;
      keyEditPopup.style.visibility = "visible";
    });
  });
};

InputManager.prototype.gamepadConnectedListener = function (event) {
  if (GAMEPAD[event.gamepad.index]) {
    let gamepadStatus = document.getElementById(
      `gamepad-${event.gamepad.index}-status`,
    );
    gamepadStatus.className = "gamepad-status-connected";
    gamepadStatus.innerHTML = "Connected";
    return;
  }
  GAMEPAD.push(Object.create(event.gamepad));
  GAMEPAD_PREV_STATE.push({
    axes: event.gamepad.axes,
    buttons: event.gamepad.buttons.map((obj) => obj.pressed),
    timestamp: event.gamepad.timestamp,
  });
  let _gamepadMap = {};
  Object.assign(_gamepadMap, DEFAULT_GAMEPAD_MAP);
  GAMEPAD_MAP.push(_gamepadMap);
  this.createControlsContainer(event.gamepad.index, event.gamepad.id);
};

InputManager.prototype.gamepadDisconnectedListener = function (event) {
  let gamepadStatus = document.getElementById(
    `gamepad-${event.gamepad.index}-status`,
  );
  gamepadStatus.className = "gamepad-status-disconnected";
  gamepadStatus.innerHTML = "Disconnected";
};

InputManager.prototype.checkGamepadState = function () {
  const gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    const gamepad = gamepads[i];
    const prev_state = GAMEPAD_PREV_STATE[i];

    if (!gamepad || !gamepad.connected) continue;
    if (!prev_state) continue;

    if (gamepad.timestamp == prev_state.timestamp) {
      continue;
    }

    // axes
    for (let j = 0; j < gamepad.axes.length; j++) {
      const threshold = 0.5;
      const gamepad_axis = gamepad.axes[j];
      const prev_state_axis = prev_state.axes[j];
      // right
      if (gamepad_axis > threshold && prev_state_axis <= threshold) {
        this.gamepadAxesDown(i, j, 1);
      }
      // left
      if (gamepad_axis < -threshold && prev_state_axis >= -threshold) {
        this.gamepadAxesDown(i, j, -1);
      }
      // released
      if (
        Math.abs(gamepad_axis) <= threshold &&
        Math.abs(prev_state_axis) > threshold
      ) {
        this.gamepadAxesUp(i, j, prev_state_axis < 0 ? -1 : 1);
      }
    }

    // buttons
    for (let j = 0; j < gamepad.buttons.length; j++) {
      const gamepad_button = gamepad.buttons[j];
      const prev_state_button = prev_state.buttons[j];
      if (!prev_state_button && gamepad_button.pressed) {
        this.gamepadButtonDown(i, j);
      }
      if (prev_state_button && !gamepad_button.pressed) {
        this.gamepadButtonUp(i, j);
      }
    }

    GAMEPAD_PREV_STATE[i].axes = gamepad.axes;
    GAMEPAD_PREV_STATE[i].buttons = gamepad.buttons.map((obj) => obj.pressed);
    GAMEPAD_PREV_STATE[i].timestamp = gamepad.timestamp;
  }
};

InputManager.prototype.gamepadButtonDown = function (i, _key) {
  const key = `button-${_key}`;
  this.gamepadInputDown(i, key);
};

InputManager.prototype.gamepadButtonUp = function (i, _key) {
  const key = `button-${_key}`;
  this.gamepadInputUp(i, key);
};

InputManager.prototype.gamepadAxesDown = function (i, _key, value) {
  const key = `axis-${_key}:${value}`;
  this.gamepadInputDown(i, key);
};

InputManager.prototype.gamepadAxesUp = function (i, _key, value) {
  const key = `axis-${_key}:${value}`;
  this.gamepadInputUp(i, key);
};

InputManager.prototype.refreshGamepadVisuals = function (i) {
  for (const [id, key] of idToKeyMap) {
    const rawKey = GAMEPAD_MAP[i][key];
    document.getElementById("gamepad-" + i + "-" + id).innerHTML = rawKey;
  }
};

InputManager.prototype.gamepadInputDown = function (i, key) {
  // edit key
  if (this.keyBeingEdited) {
    GAMEPAD_MAP[i][this.keyBeingEdited] = key;
    this.keyBeingEdited = null;
    keyEditPopup.style.visibility = "hidden";
    this.refreshGamepadVisuals(i);
    // this.saveKeyMapToCookie();
    return;
  }

  // Handle global shortcuts
  switch (key) {
    case GAMEPAD_MAP[i].RESTART:
      G_Restart();
      break;

    case GAMEPAD_MAP[i].REWIND:
      G_Rewind();
      break;

    case GAMEPAD_MAP[i].FAST_FORWARD:
      G_FastForward();
      break;

    case GAMEPAD_MAP[i].START_PAUSE:
      G_StartPause();
      break;

    case GAMEPAD_MAP[i].QUIT:
      G_Quit();
      break;
  }

  // Track whether keys are held regardless of state
  switch (key) {
    case GAMEPAD_MAP[i].LEFT:
      this.leftHeld = true;
      break;
    case GAMEPAD_MAP[i].RIGHT:
      this.rightHeld = true;
      break;
    case GAMEPAD_MAP[i].DOWN:
      this.downHeld = true;
      break;
  }

  // Only actually move the pieces if in the proper game state
  const gameState = G_GetGameState();
  if (canMovePiecesSidewaysOrRotate(gameState)) {
    switch (key) {
      case GAMEPAD_MAP[i].LEFT:
        this.handleTappedDirection(Direction.LEFT);
        break;
      case GAMEPAD_MAP[i].RIGHT:
        this.handleTappedDirection(Direction.RIGHT);
        break;
      case GAMEPAD_MAP[i].ROTATE_LEFT:
        G_RotatePieceLeft();
        break;
      case GAMEPAD_MAP[i].ROTATE_RIGHT:
        G_RotatePieceRight();
        break;
    }
  } else {
    switch (key) {
      case GAMEPAD_MAP[i].ROTATE_LEFT:
        console.log("rotate rejected, state: ", G_GetGameState());
        break;
      case GAMEPAD_MAP[i].ROTATE_RIGHT:
        console.log("rotate rejected, state: ", G_GetGameState());
        break;
    }
  }

  if (canDoAllPieceMovements(gameState)) {
    switch (key) {
      case GAMEPAD_MAP[i].DOWN:
        this.isSoftDropping = true;
        break;
    }
  }
};

InputManager.prototype.gamepadInputUp = function (i, key) {
  // Track whether keys are held regardless of state
  if (key == GAMEPAD_MAP[i].LEFT) {
    this.leftHeld = false;
  } else if (key == GAMEPAD_MAP[i].RIGHT) {
    this.rightHeld = false;
  } else if (key == GAMEPAD_MAP[i].DOWN) {
    this.downHeld = false;
    this.isSoftDropping = false; // Can stop soft dropping in any state
    this.cellSoftDropped = 0;
  }
};

/* ---------------------
    Private helpers
---------------------- */

InputManager.prototype.tryShiftPiece = function (direction) {
  // Try to move the piece and store whether it actually did or not
  const didMove =
    direction == Direction.LEFT ? G_MovePieceLeft() : G_MovePieceRight();
  // Wall charge if it didn't move
  if (!didMove) {
    this.setDASCharge(GameSettings.getDASTriggerThreshold());
  }
  return didMove;
};

InputManager.prototype.handleHeldDirection = function (direction) {
  const DASTriggerThreshold = GameSettings.getDASTriggerThreshold();
  // Increment DAS
  this.setDASCharge(Math.min(DASTriggerThreshold, this.dasCharge + 1));

  // Attempt to shift the piece once it hits the trigger
  if (this.dasCharge == DASTriggerThreshold) {
    const didMove = this.tryShiftPiece(direction);
    if (didMove) {
      // Move DAS to charged floor for another cycle of ARR
      this.setDASCharge(GameSettings.getDASChargedFloor());
    }
  }
};

// Handle single taps of the dpad, if in the proper state
InputManager.prototype.handleTappedDirection = function (direction) {
  if (canMovePiecesSidewaysOrRotate(G_GetGameState())) {
    // Update the DAS charge
    this.setDASCharge(GameSettings.getDASChargeAfterTap());

    this.tryShiftPiece(direction);
  }
};

// Updates the DAS charge and refreshes the debug text
InputManager.prototype.setDASCharge = function (value) {
  this.dasCharge = value;
  // this.refreshDebugText();
};

InputManager.prototype.refreshDebugText = function () {
  let debugStr = "";
  let dasVisualized = "";
  for (let i = 0; i < this.dasCharge; i++) {
    dasVisualized += "|";
  }
  // Have something on the second line so it's always the same height
  if (this.dasCharge == 0) {
    dasVisualized = ".";
  }
  debugStr +=
    this.dasCharge +
    "/" +
    GameSettings.getDASTriggerThreshold() +
    "\n" +
    dasVisualized;
};

// Checks if the game state allows for piece movements horizontally
function canMovePiecesSidewaysOrRotate(gameState) {
  return (
    !GetIsPaused() &&
    (gameState == GameState.RUNNING || gameState == GameState.FIRST_PIECE)
  );
}

// Checks if the game state allows for downward piece movement
function canDoAllPieceMovements(gameState) {
  return !GetIsPaused() && gameState == GameState.RUNNING;
}

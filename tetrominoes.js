const PIECE_I = [
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
  [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
  [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]
];

const PIECE_J = [
  [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
  [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
  [[0, 1, 0], [0, 1, 0], [1, 1, 0]]
];

const PIECE_L = [
  [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
  [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
  [[1, 1, 0], [0, 1, 0], [0, 1, 0]]
];

const PIECE_O = [[[0, 0, 0, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]]];

const PIECE_S = [
  [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
  [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
  [[1, 0, 0], [1, 1, 0], [0, 1, 0]]
];

const PIECE_T = [
  [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
  [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
];

const PIECE_Z = [
  [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
  [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
  [[0, 1, 0], [1, 1, 0], [1, 0, 0]]
];

// The piece list, with colors
export const PIECES = [
  [PIECE_Z, "red"],
  [PIECE_S, "blue"],
  [PIECE_T, "white"],
  [PIECE_O, "white"],
  [PIECE_L, "red"],
  [PIECE_I, "white"],
  [PIECE_J, "blue"]
];

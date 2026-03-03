export const STORAGE_KEY = 'backgammon.save.v1';
export const SCHEMA_VERSION = 1;

export const PLAYER_A = 'A';
export const PLAYER_B = 'B';

export const HOME_BOARD = {
  A: [0, 5],
  B: [18, 23]
};

export const STARTING_POINTS = [
  -2, 0, 0, 0, 0, 5,
  0, 3, 0, 0, 0, -5,
  5, 0, 0, 0, -3, 0,
  -5, 0, 0, 0, 0, 2
];

export const MAX_UNDO = 300;

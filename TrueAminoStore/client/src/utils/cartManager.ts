// This utility helps prevent multiple cart clearing operations
let cartHasBeenCleared = false;

export const markCartCleared = () => {
  cartHasBeenCleared = true;
};

export const hasCartBeenCleared = () => {
  return cartHasBeenCleared;
};

export const resetCartClearedFlag = () => {
  cartHasBeenCleared = false;
};
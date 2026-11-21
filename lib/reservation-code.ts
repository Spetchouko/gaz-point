import { randomInt } from "node:crypto";

export const RESERVATION_CODE_LENGTH = 12;
export const LEGACY_RESERVATION_CODE_LENGTH = 10;
export const RESERVATION_CODE_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function isValidReservationCodeLength(code: string): boolean {
  return (
    code.length === RESERVATION_CODE_LENGTH ||
    code.length === LEGACY_RESERVATION_CODE_LENGTH
  );
}

export function isValidReservationCode(code: string): boolean {
  if (!isValidReservationCodeLength(code)) return false;
  return code
    .split("")
    .every((character) => RESERVATION_CODE_ALPHABET.includes(character.toUpperCase()));
}

export function randomReservationCodeSuffix(length = 2): string {
  let suffix = "";
  for (let index = 0; index < length; index += 1) {
    suffix += RESERVATION_CODE_ALPHABET[
      randomInt(0, RESERVATION_CODE_ALPHABET.length)
    ];
  }
  return suffix;
}

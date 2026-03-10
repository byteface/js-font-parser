export const EXIT_CODES = {
  OK: 0,
  USAGE: 2,
  INPUT: 3,
  IO: 4,
  COMMAND: 5,
  INTERNAL: 10
};

export class CliError extends Error {
  constructor(code, message, exitCode = EXIT_CODES.COMMAND, details = null) {
    super(message);
    this.name = "CliError";
    this.code = code;
    this.exitCode = exitCode;
    this.details = details;
  }
}

export function usageError(message, details = null) {
  return new CliError("E_USAGE", message, EXIT_CODES.USAGE, details);
}

export function inputError(message, details = null) {
  return new CliError("E_INPUT", message, EXIT_CODES.INPUT, details);
}

export function ioError(message, details = null) {
  return new CliError("E_IO", message, EXIT_CODES.IO, details);
}

export function commandError(message, details = null) {
  return new CliError("E_COMMAND", message, EXIT_CODES.COMMAND, details);
}

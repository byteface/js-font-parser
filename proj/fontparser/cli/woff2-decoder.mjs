import path from "node:path";
import { pathToFileURL } from "node:url";

import { inputError } from "./errors.mjs";

function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === "function";
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) return new Uint8Array(value);
  throw inputError("WOFF2 decoder returned unsupported output. Expected Uint8Array, Buffer, or ArrayBuffer.");
}

function unwrapDecoderCandidate(mod) {
  const candidates = [mod?.default, mod];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "function") return { decode: candidate };
    if (typeof candidate.decode === "function") return { decode: candidate.decode.bind(candidate) };
  }
  return null;
}

async function importDecoderModule(specifier) {
  if (!specifier) {
    throw inputError("--woff2-decoder requires a module name or file path.");
  }
  const isPathLike = specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("file:");
  if (isPathLike) {
    const resolved = specifier.startsWith("file:")
      ? specifier
      : pathToFileURL(path.resolve(process.cwd(), specifier)).href;
    return import(resolved);
  }
  return import(specifier);
}

export async function configureWoff2Decoder(specifier, setSyncDecoder, setAsyncDecoder) {
  if (!specifier) return null;

  let imported;
  try {
    imported = await importDecoderModule(String(specifier));
  } catch (err) {
    throw inputError(`Failed to load WOFF2 decoder module "${specifier}".`, { cause: String(err?.message || err) });
  }

  const wrapper = unwrapDecoderCandidate(imported);
  if (!wrapper) {
    throw inputError(
      `Invalid WOFF2 decoder module "${specifier}". Export a function or an object with decode(data).`
    );
  }

  const decode = wrapper.decode;
  setSyncDecoder((data) => {
    const out = decode(data);
    if (isPromiseLike(out)) {
      throw inputError(
        `WOFF2 decoder "${specifier}" is async-only. Export a synchronous decode(data) for CLI commands.`
      );
    }
    return toUint8Array(out);
  });
  setAsyncDecoder(async (data) => toUint8Array(await decode(data)));
  return { specifier: String(specifier) };
}


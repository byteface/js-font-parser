export function writeJsonSuccess(command, data = {}, meta = {}) {
  const payload = {
    ok: true,
    command,
    data
  };
  if (meta && Object.keys(meta).length > 0) payload.meta = meta;
  console.log(JSON.stringify(payload, null, 2));
}

export function writeJsonError(errorLike, command = null) {
  const code = errorLike?.code || "E_INTERNAL";
  const message = errorLike?.message || "Unexpected error";
  const details = errorLike?.details ?? null;
  const payload = {
    ok: false,
    command,
    error: { code, message }
  };
  if (details != null) payload.error.details = details;
  console.error(JSON.stringify(payload, null, 2));
}

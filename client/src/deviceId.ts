const KEY = "att.deviceId";

export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (id) return id;
  id = crypto.randomUUID();
  localStorage.setItem(KEY, id);
  return id;
}

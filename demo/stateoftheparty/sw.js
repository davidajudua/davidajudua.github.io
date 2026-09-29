// Opens the sealed demo for a browser that has the password.
// sync-to-portfolio.sh publishes every page as a gate with its sealed copy inside,
// and every other file under sealed/ with a name only the password can work out.
const GATE = {"salt": "+WS4IeKeZk+iJGWCCNCfqw==", "iterations": 600000, "check": "T13OXd5SE1YdUajX75QWsnjqbQ4Gj3v9BJU/Iw=="};

const scope = new URL("./", location.href);
const utf8 = (text) => new TextEncoder().encode(text);
const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

function db(mode, use) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("sotp-demo-gate", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("keys");
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const tx = req.result.transaction("keys", mode);
      const op = use(tx.objectStore("keys"));
      tx.oncomplete = () => {
        req.result.close();
        resolve(op.result);
      };
      tx.onerror = () => reject(tx.error);
    };
  });
}

let keys;
const saved = () => (keys ??= db("readonly", (store) => store.get("keys")).catch(() => undefined));

async function derive(password) {
  const base = await crypto.subtle.importKey("raw", utf8(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: bytes(GATE.salt), iterations: GATE.iterations },
    base,
    256,
  );
  const master = await crypto.subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
  const sub = (info, algorithm, usage) =>
    crypto.subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(), info: utf8(info) },
      master,
      algorithm,
      false,
      [usage],
    );
  return {
    enc: await sub("sotp-demo enc", { name: "AES-GCM", length: 256 }, "decrypt"),
    name: await sub("sotp-demo name", { name: "HMAC", hash: "SHA-256", length: 256 }, "sign"),
  };
}

const open = (key, sealed) => crypto.subtle.decrypt({ name: "AES-GCM", iv: sealed.subarray(0, 12) }, key, sealed.subarray(12));

async function unlocks(k) {
  if (!k) return false;
  return open(k.enc, bytes(GATE.check)).then(() => true, () => false);
}

async function page(request) {
  const [res, k] = await Promise.all([fetch(request), saved()]);
  const sealed = res.ok && k && (await res.clone().text()).match(/id="sealed">([^<]+)</)?.[1];
  if (!sealed) return res;
  try {
    return new Response(await open(k.enc, bytes(sealed)), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch {
    // A key from an older password: show the gate again.
    return res;
  }
}

async function file(rel, request) {
  const k = await saved();
  if (!k) return fetch(request);
  const name = hex(await crypto.subtle.sign("HMAC", k.name, utf8(rel))).slice(0, 32);
  const res = await fetch(new URL(`sealed/${name}`, scope));
  if (!res.ok) return res;
  const plain = new Uint8Array(await open(k.enc, new Uint8Array(await res.arrayBuffer())));
  const cut = plain.indexOf(10);
  return new Response(plain.subarray(cut + 1), {
    headers: { "Content-Type": new TextDecoder().decode(plain.subarray(0, cut)) },
  });
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || !url.href.startsWith(scope.href)) return;
  let rel = decodeURIComponent(url.pathname.slice(scope.pathname.length));
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  event.respondWith(rel.endsWith(".html") ? page(event.request) : file(rel, event.request));
});

// The gate asks with { password } to unlock, or with {} to learn whether this browser already has.
self.addEventListener("message", (event) => event.waitUntil(answer(event)));

async function answer({ data, ports: [port] }) {
  if (data.password === undefined) return port.postMessage(await unlocks(await saved()));
  const k = await derive(data.password);
  if (!(await unlocks(k))) return port.postMessage(false);
  keys = Promise.resolve(k);
  // Without storage the key only lasts as long as this worker does.
  await db("readwrite", (store) => store.put(k, "keys")).catch(() => {});
  port.postMessage(true);
}

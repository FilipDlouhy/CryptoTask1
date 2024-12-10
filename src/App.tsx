import React, { useState } from "react";
import * as bigintCryptoUtils from "bigint-crypto-utils";
import JSZip from "jszip";
import CryptoJS from "crypto-js";
import { saveAs } from "file-saver";

const App = () => {
  const [jazyk, setJazyk] = useState<"cs" | "en">("cs");
  const [klicN, setKlicN] = useState("");
  const [klicE, setKlicE] = useState("");
  const [klicD, setKlicD] = useState("");

  const [verejnyKlic, setVerejnyKlic] = useState<{
    n: bigint;
    e: bigint;
  } | null>(null);
  const [soukromyKlic, setSoukromyKlic] = useState<{
    n: bigint;
    d: bigint;
  } | null>(null);

  const [vybranySoubor, setVybranySoubor] = useState<File | null>(null);
  const [souborInfo, setSouborInfo] = useState<{
    name: string;
    size: number;
    type: string;
    lastModifiedDate: Date | null;
  } | null>(null);

  const [hashSouboru, setHashSouboru] = useState<string>("");

  const texty = {
    cs: {
      cs: "Česky",
      en: "Anglicky",
      title: "Elektronický podpis (RSA + SHA3-256)",
      encrypt: "Šifrování",
      decrypt: "Dešifrování",
      generateKeys: "Generovat klíče",
      publicKey: "Veřejný klíč",
      privateKey: "Soukromý klíč",
      mode: "Režim",
      encryptMode: "Šifrovat",
      decryptMode: "Dešifrovat",
      inputText: "Vstupní text nebo šifra",
      keyN: "Klíč n",
      keyE: "Klíč e",
      keyD: "Klíč d",
      result: "Výsledek",
      selectFile: "Vybrat soubor k podpisu",
      signFile: "Podepsat soubor",
      verifySign: "Ověřit podpis",
      exportPriv: "Exportovat soukromý klíč",
      exportPub: "Exportovat veřejný klíč",
      selectZip: "Vybrat ZIP s podepsaným souborem",
      selectPubKey: "Vybrat veřejný klíč (.pub)",
    },
    en: {
      cs: "Czech",
      en: "English",
      title: "Electronic Signature (RSA + SHA3-256)",
      encrypt: "Encryption",
      decrypt: "Decryption",
      generateKeys: "Generate Keys",
      publicKey: "Public Key",
      privateKey: "Private Key",
      mode: "Mode",
      encryptMode: "Encrypt",
      decryptMode: "Decrypt",
      inputText: "Input text or cipher",
      keyN: "Key n",
      keyE: "Key e",
      keyD: "Key d",
      result: "Result",
      selectFile: "Select file to sign",
      signFile: "Sign File",
      verifySign: "Verify Signature",
      exportPriv: "Export Private Key",
      exportPub: "Export Public Key",
      selectZip: "Select ZIP with signed file",
      selectPubKey: "Select public key (.pub)",
    },
  };

  const prepinaniJazyka = (lang: "cs" | "en") => {
    setJazyk(lang);
  };

  function nsd(a: bigint, b: bigint): bigint {
    return b === BigInt(0) ? a : nsd(b, a % b);
  }

  const generujKlice = async () => {
    const { p, q } = await generujNahodneCislo(256);
  
    const n = p * q;
    const phi = (p - BigInt(1)) * (q - BigInt(1));
    let e = BigInt(65537); 
  
    while (nsd(e, phi) !== BigInt(1)) {
      e += BigInt(2);
    }
  
    const d = modInv(e, phi);
  
    const verejny = { n, e };
    const soukromy = { n, d };
  
    setVerejnyKlic(verejny);
    setSoukromyKlic(soukromy);
    setKlicN(n.toString());
    setKlicE(e.toString());
    setKlicD(d.toString());
  };
 
  
  function modInv(a: bigint, m: bigint): bigint {
    const m0 = m;
    let x0 = BigInt(0);
    let x1 = BigInt(1);

    if (m === BigInt(1)) return BigInt(0);

    while (a > BigInt(1)) {
      const q = a / m;
      let t = m;

      m = a % m;
      a = t;
      t = x0;

      x0 = x1 - q * x0;
      x1 = t;
    }

    if (x1 < BigInt(0)) x1 += m0;

    return x1;
  }

  function mocninaMod(a: bigint, b: bigint, n: bigint): bigint {
    let result = BigInt(1);
    a = a % n;
    while (b > BigInt(0)) {
      if (b % BigInt(2) === BigInt(1)) {
        result = (result * a) % n;
      }
      b = b / BigInt(2);
      a = (a * a) % n;
    }
    return result;
  }

  async function generujPrvocislo(bits: number): Promise<bigint> {
    while (true) {
      const moznePrvocislo = await bigintCryptoUtils.prime(bits);
      if (jePrvocislo(moznePrvocislo)) {
        return moznePrvocislo;
      }
    }
  }
  

  async function generujNahodneCislo(
    bits: number
  ): Promise<{ p: bigint; q: bigint }> {
    const p = await generujPrvocislo(bits);
    let q: bigint;
    do {
      q = await generujPrvocislo(bits);
    } while (q === p);
    return { p, q };
  }

  function jePrvocislo(n: bigint, k = 5): boolean {
    if (n <= BigInt(1)) return false;
    if (n <= BigInt(3)) return true;

    for (let i = 0; i < k; i++) {
      const a =
        BigInt(2) + BigInt(Math.floor(Math.random() * Number(n - BigInt(4))));
      if (mocninaMod(a, n - BigInt(1), n) !== BigInt(1)) {
        return false;
      }
    }
    return true;
  }

  const nactiSouborJakoPoleBytu = (soubor: File): Promise<ArrayBuffer> => {
    return new Promise((vyres, odmitni) => {
      const ctecka = new FileReader();
      ctecka.onload = (udalost) => {
        vyres(udalost.target?.result as ArrayBuffer);
      };
      ctecka.onerror = (chyba) => {
        console.error("Chyba při čtení souboru:", chyba);
        odmitni(chyba);
      };
      ctecka.readAsArrayBuffer(soubor);
    });
  };
  const vybratSoubor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soubor = e.target.files?.[0] || null;
    if (soubor) {
      setVybranySoubor(soubor);
      setSouborInfo({
        name: soubor.name,
        size: soubor.size,
        type: soubor.type || "neznámý",
        lastModifiedDate: soubor.lastModified
          ? new Date(soubor.lastModified)
          : null,
      });
    }
  };

  const spocitejHashSouboru = async () => {
    if (!vybranySoubor) {
      return;
    }
    const data = await nactiSouborJakoPoleBytu(vybranySoubor);
    const wordArray = CryptoJS.lib.WordArray.create(
      new Uint8Array(data) as any
    );
    const hash = CryptoJS.SHA3(wordArray, { outputLength: 256 }).toString();
    setHashSouboru(hash);
  };

  const podepsatSoubor = async () => {
    if (!soukromyKlic) {
      return;
    }
    if (!vybranySoubor) {
      return;
    }
    if (!hashSouboru) {
      return;
    }
  
    const hashVelkeCislo = BigInt("0x" + hashSouboru);
    const podpis = mocninaMod(hashVelkeCislo, soukromyKlic.d, soukromyKlic.n);
  
    const podpisHex = podpis.toString(16);
    const podpisBajty = new Uint8Array(Math.ceil(podpisHex.length / 2));
    for (let i = 0; i < podpisBajty.length; i++) {
      podpisBajty[i] = parseInt(podpisHex.substr(i * 2, 2), 16);
    }
    let binarniRetezec = "";
    for (let i = 0; i < podpisBajty.length; i++) {
      binarniRetezec += String.fromCharCode(podpisBajty[i]);
    }
    const podpisBase64 = btoa(binarniRetezec);
  
    const obsahPodpisu = "RSA_SHA3-512 " + podpisBase64;
  
    const zip = new JSZip();
    const originalniData = await nactiSouborJakoPoleBytu(vybranySoubor);
    zip.file(vybranySoubor.name, originalniData);
    zip.file(vybranySoubor.name + ".sign", obsahPodpisu);
  
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "podepsany_soubor.zip");
  };
  

  const exportPriv = () => {
    if (!soukromyKlic) {
      return;
    }
    const nBase64 = btoa(soukromyKlic.n.toString());
    const dBase64 = btoa(soukromyKlic.d.toString());
    const privContent = "RSA " + nBase64 + " " + dBase64;
    const blob = new Blob([privContent], { type: "text/plain" });
    saveAs(blob, "key.priv");
  };

  const exportujVerejnyKlic = () => {
    if (!verejnyKlic) {
      return;
    }
    const nBase64 = btoa(verejnyKlic.n.toString());
    const eBase64 = btoa(verejnyKlic.e.toString());
    const obsahKlice = "RSA " + nBase64 + " " + eBase64;
    const blob = new Blob([obsahKlice], { type: "text/plain" });
    saveAs(blob, "klic.pub");
  };
  

  const [zipProOvereni, setZipProOvereni] = useState<File | null>(null);
  const [pubProOvereni, setPubProOvereni] = useState<File | null>(null);
  const [vysledekOvereni, setVysledekOvereni] = useState<string>("");

  const vybratZipProOvereni = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soubor = e.target.files?.[0] || null;
    setZipProOvereni(soubor);
  };

  const vybratPubProOvereni = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soubor = e.target.files?.[0] || null;
    setPubProOvereni(soubor);
  };

  const overitPodpis = async () => {
    if (!zipProOvereni) {
      return;
    }
    if (!pubProOvereni) {
      return;
    }
  
    const obsahKlice = await (
      await fetch(URL.createObjectURL(pubProOvereni))
    ).text();
    const casti = obsahKlice.split(" ");
    const nBase64 = casti[1];
    const eBase64 = casti[2];
    const nHodnota = BigInt(atob(nBase64));
    const eHodnota = BigInt(atob(eBase64));
  
    const zipData = await nactiSouborJakoPoleBytu(zipProOvereni);
    const zip = await JSZip.loadAsync(zipData);
  
    let nazevSouboruPodpisu = "";
    let nazevPuvodnihoSouboru = "";
    zip.forEach((relativniCesta, soubor) => {
      if (relativniCesta.endsWith(".sign")) {
        nazevSouboruPodpisu = relativniCesta;
      } else {
        nazevPuvodnihoSouboru = relativniCesta;
      }
    });
  
    if (!nazevSouboruPodpisu || !nazevPuvodnihoSouboru) {
      setVysledekOvereni("ZIP neobsahuje .sign nebo původní soubor");
      return;
    }
  
    const obsahPodpisu = await zip.file(nazevSouboruPodpisu)?.async("string");
    const obsahPuvodniho = await zip
      .file(nazevPuvodnihoSouboru)
      ?.async("arraybuffer");
    if (!obsahPodpisu || !obsahPuvodniho) {
      setVysledekOvereni("Nepodařilo se načíst data ze ZIPu");
      return;
    }
  
    const castiPodpisu = obsahPodpisu.split(" ");
    const podpisBase64 = castiPodpisu[1];
  
    const podpisBajty = Uint8Array.from(atob(podpisBase64), (znak) =>
      znak.charCodeAt(0)
    );
  
    const puvodniSlovo = CryptoJS.lib.WordArray.create(
      new Uint8Array(obsahPuvodniho) as any
    );
    const prepocitanyHash = CryptoJS.SHA3(puvodniSlovo, {
      outputLength: 256,
    }).toString();
  
    let hexString = "";
    for (let i = 0; i < podpisBajty.length; i++) {
      hexString += podpisBajty[i].toString(16).padStart(2, "0");
    }
    const podpisBigInt = BigInt("0x" + hexString);
  
    const overenyHashBigInt = mocninaMod(podpisBigInt, eHodnota, nHodnota);
    let overenyHashHex = overenyHashBigInt.toString(16).replace(/^0+/, "");
  
    if (overenyHashHex === prepocitanyHash) {
      setVysledekOvereni("Podpis je platný.");
    } else {
      setVysledekOvereni("Podpis není platný.");
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-indigo-600 flex flex-col justify-center items-center py-10">
      <div className="bg-white rounded-lg shadow-lg p-10 w-full max-w-5xl">
        <div className="flex justify-end mb-4">
          <button
            className={`mr-2 px-3 py-1 rounded ${
              jazyk === "cs"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => prepinaniJazyka("cs")}
          >
            {texty[jazyk].cs}
          </button>
          <button
            className={`px-3 py-1 rounded ${
              jazyk === "en"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => prepinaniJazyka("en")}
          >
            {texty[jazyk].en}
          </button>
        </div>

        <h1 className="text-4xl font-bold text-center text-indigo-800 mb-8">
          {texty[jazyk].title}
        </h1>

        <button
          onClick={() => generujKlice()}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
        >
          {texty[jazyk].generateKeys}
        </button>

        {verejnyKlic && soukromyKlic && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold ">
              {texty[jazyk].publicKey}:
            </h2>
            <p>
              <span className="font-semibold">n:</span>{" "}
              <span className="break-words max-w-full inline-block">
                {verejnyKlic.n.toString()}
              </span>
            </p>
            <p>
              <span className="font-semibold">e:</span>{" "}
              <span className="break-words max-w-full inline-block">
                {verejnyKlic.e.toString()}
              </span>
            </p>
            <h2 className="text-xl font-semibold mt-2">
              {texty[jazyk].privateKey}:
            </h2>
            <p>
              <span className="font-semibold">n:</span>{" "}
              <span className="break-words max-w-full inline-block">
                {soukromyKlic.n.toString()}
              </span>
            </p>
            <p>
              <span className="font-semibold">d:</span>{" "}
              <span className="break-words max-w-full inline-block">
                {soukromyKlic.d.toString()}
              </span>
            </p>
          </div>
        )}

        <button
          onClick={exportujVerejnyKlic}
          className="w-full bg-yellow-500 text-white px-4 py-2 rounded mb-4 hover:bg-yellow-600"
        >
          {texty[jazyk].exportPub}
        </button>
        <button
          onClick={exportPriv}
          className="w-full bg-yellow-500 text-white px-4 py-2 rounded mb-4 hover:bg-yellow-600"
        >
          {texty[jazyk].exportPriv}
        </button>

        <label className="block mb-4 font-semibold">
          {texty[jazyk].selectFile}:
          <input
            type="file"
            onChange={vybratSoubor}
            className="w-full mt-1 p-2 border rounded"
          />
        </label>

        {souborInfo && (
          <div className="mb-4">
            <p>
              <strong>Název:</strong> {souborInfo.name}
            </p>
            <p>
              <strong>Velikost:</strong> {souborInfo.size} bajtů
            </p>
            <p>
              <strong>Typ:</strong> {souborInfo.type}
            </p>
            <p>
              <strong>Poslední úprava:</strong>{" "}
              {souborInfo.lastModifiedDate?.toLocaleString()}
            </p>
          </div>
        )}

        <button
          onClick={spocitejHashSouboru}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
        >
          Spočítat hash
        </button>

        {hashSouboru && (
          <div className="mb-4">
            <strong>Hash (SHA3-256):</strong> {hashSouboru}
          </div>
        )}

        <button
          onClick={podepsatSoubor}
          className="w-full bg-green-500 text-white px-4 py-2 rounded mb-4 hover:bg-green-600"
        >
          {texty[jazyk].signFile}
        </button>

        <hr className="my-8" />

        <h2 className="text-xl font-semibold mb-4">Ověření podpisu</h2>
        <label className="block mb-4">
          {texty[jazyk].selectZip}:
          <input
            type="file"
            onChange={vybratZipProOvereni}
            className="w-full mt-1 p-2 border rounded"
          />
        </label>
        <label className="block mb-4">
          {texty[jazyk].selectPubKey}:
          <input
            type="file"
            onChange={vybratPubProOvereni}
            className="w-full mt-1 p-2 border rounded"
          />
        </label>

        <button
          onClick={overitPodpis}
          className="w-full bg-orange-500 text-white px-4 py-2 rounded mb-4 hover:bg-orange-600"
        >
          {texty[jazyk].verifySign}
        </button>

        {vysledekOvereni && (
          <div className="mb-4">
            <strong>Výsledek ověření:</strong> {vysledekOvereni}
          </div>
        )}

        <hr className="my-8" />
      </div>
    </div>
  );
};

export default App;

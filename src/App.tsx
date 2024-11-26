import { useState } from "react";

const App = () => {
  const [jazyk, setJazyk] = useState<"cs" | "en">("cs");
  const [vstupniText, setVstupniText] = useState("");
  const [zasifrovanaZprava, setZasifrovanaZprava] = useState("");
  const [klicN, setKlicN] = useState("");
  const [klicE, setKlicE] = useState("");
  const [klicD, setKlicD] = useState("");
  const [rezimSifrovani, setRezimSifrovani] = useState(true);
  const [verejnyKlic, setVerejnyKlic] = useState<{
    n: bigint;
    e: bigint;
  } | null>(null);
  const [soukromyKlic, setSoukromyKlic] = useState<{
    n: bigint;
    d: bigint;
  } | null>(null);

  // Konstanty
  const velikostBloku = 6;
  const delkaPrvocisla = 13;
  const velikostZnaku = 8;

  const texty = {
    cs: {
      cs: "Česky",
      en: "Anglicky",
      title: "RSA Šifra",
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
      keyE: "Klíč e (pro šifrování)",
      keyD: "Klíč d (pro dešifrování)",
      result: "Výsledek",
    },
    en: {
      cs: "Czech",
      en: "English",
      title: "RSA Cipher",
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
      keyE: "Key e (for encryption)",
      keyD: "Key d (for decryption)",
      result: "Result",
    },
  };

  const prepinaniJazyka = (lang: "cs" | "en") => {
    setJazyk(lang);
  };

  const generujKlice = () => {
    const generujRuznaPrvocisla = () => {
      const p = generujPrvocislo(delkaPrvocisla);
      let q;
      do {
        q = generujPrvocislo(delkaPrvocisla);
      } while (q === p);
      return { p, q };
    };
  
    const vytvorVerejnyKlic = (phi: bigint) => {
      const fermatovoE = BigInt(65537);
      return eZadanePodminkami(fermatovoE, phi) 
        ? fermatovoE 
        : najdiE(phi);
    };
  
    const { p, q } = generujRuznaPrvocisla();
    const n = p * q;
    const phi = (p - BigInt(1)) * (q - BigInt(1));
    const e = vytvorVerejnyKlic(phi);
    const d = modInv(e, phi);
  
    const verejny = { n, e };
    const soukromy = { n, d };
    
    setVerejnyKlic(verejny);
    setSoukromyKlic(soukromy);
    setKlicN(n.toString());
    setKlicE(e.toString());
    setKlicD(d.toString());
  };
  const pripravText = (text: string): string => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const prevodTextuNaCislo = (text: string): bigint[] => {
    const doplnenyText = text.padEnd(
      Math.ceil(text.length / velikostBloku) * velikostBloku
    );
    
    return Array.from({ length: doplnenyText.length / velikostBloku }, (_, i) => {
      const binarniBlok = doplnenyText
        .slice(i * velikostBloku, (i + 1) * velikostBloku)
        .split('')
        .map(znak => znak.charCodeAt(0).toString(2).padStart(velikostZnaku, '0'))
        .join('');
      
      return BigInt('0b' + binarniBlok);
    });
  };

  const prevodCislaNaText = (bloky: bigint[]): string => {
    return bloky
      .map(blok => {
        const binarniReprezentace = blok.toString(2)
          .padStart(velikostZnaku * velikostBloku, "0");
        
        return Array.from({ length: velikostBloku }, (_, i) => {
          const start = i * velikostZnaku;
          const binarniZnak = binarniReprezentace.slice(start, start + velikostZnaku);
          const asciiKod = parseInt(binarniZnak, 2);
          
          const jePosledniZnak = start === (velikostBloku - 1) * velikostZnaku;
          if (asciiKod === 32 && jePosledniZnak) return '';
          
          return String.fromCharCode(asciiKod);
        }).join('');
      })
      .join('')
      .trimEnd();
  };

  const sifrujVerejnymKlicem = (
    bloky: bigint[],
    n: bigint,
    e: bigint
  ): bigint[] => {
    return bloky.map((blok) => mocninaMod(blok, e, n));
  };

  const desifrujSoukromymKlicem = (
    bloky: bigint[],
    n: bigint,
    d: bigint
  ): bigint[] => {
    return bloky.map((blok) => mocninaMod(blok, d, n));
  };

  const zpracujZpravu = () => {
    try {
      const n = BigInt(klicN);
      const e = BigInt(klicE);
      const d = BigInt(klicD);

      if (rezimSifrovani) {
        const upravenyText = pripravText(vstupniText);
        const bloky = prevodTextuNaCislo(upravenyText);
        const zasifrovaneBloky = sifrujVerejnymKlicem(bloky, n, e);
        setZasifrovanaZprava(zasifrovaneBloky.join(" "));
      } else {
        const cisla = vstupniText.trim().split(/\s+/);
        if (cisla.some(cislo => !/^\d+$/.test(cislo))) {
          throw new Error("Vstup musí obsahovat pouze čísla oddělená mezerami");
        }
        const bloky = cisla.map((blok) => BigInt(blok));
        const desifrovaneBloky = desifrujSoukromymKlicem(bloky, n, d);
        const text = prevodCislaNaText(desifrovaneBloky);
        setZasifrovanaZprava(text);
      }
    } catch (error) {
      setZasifrovanaZprava(`Chyba: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
    }
  };

  function eZadanePodminkami(e: bigint, phi: bigint): boolean {
    return e < phi && nsd(e, phi) === BigInt(1);
  }

  function najdiE(phi: bigint): bigint {
    let e = phi - BigInt(2);
    while (e > BigInt(2)) {
      if (nsd(e, phi) === BigInt(1)) {
        return e;
      }
      e -= BigInt(1);
    }
    throw new Error("Nelze najít vhodné e");
  }

  function nsd(a: bigint, b: bigint): bigint {
    return b === BigInt(0) ? a : nsd(b, a % b);
  }

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

  function generujPrvocislo(delka: number): bigint {
    let prvocislo: bigint;
    do {
      prvocislo = generujNahodneCislo(delka);
    } while (!jePrvocislo(prvocislo));
    return prvocislo;
  }

  function generujNahodneCislo(delka: number): bigint {
    const min = BigInt("1" + "0".repeat(delka - 1));
    const max = BigInt("9".repeat(delka));
    const rozdil = max - min;
    const nahodneCislo =
      min + BigInt(Math.floor(Math.random() * Number(rozdil)));
    return nahodneCislo;
  }

  function jePrvocislo(n: bigint, k = 5): boolean {
    if (n <= BigInt(1)) return false;
    if (n <= BigInt(3)) return true;

    for (let i = 0; i < k; i++) {
      const a = BigInt(2) + BigInt(Math.floor(Math.random() * Number(n - BigInt(4))));
      if (mocninaMod(a, n - BigInt(1), n) !== BigInt(1)) {
        return false;
      }
    }
    return true;
  }

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
          onClick={generujKlice}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
        >
          {texty[jazyk].generateKeys}
        </button>

        {verejnyKlic && soukromyKlic && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{texty[jazyk].publicKey}:</h2>
            <p>
              <span className="font-semibold">n:</span> {verejnyKlic.n.toString()}
            </p>
            <p>
              <span className="font-semibold">e:</span> {verejnyKlic.e.toString()}
            </p>
            <h2 className="text-xl font-semibold mt-2">{texty[jazyk].privateKey}:</h2>
            <p>
              <span className="font-semibold">n:</span> {soukromyKlic.n.toString()}
            </p>
            <p>
              <span className="font-semibold">d:</span> {soukromyKlic.d.toString()}
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2 font-semibold">
            {texty[jazyk].inputText}:
            <textarea
              value={vstupniText}
              onChange={(e) => setVstupniText(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
              rows={4}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <label className="block">
            <span className="font-semibold">{texty[jazyk].keyN}:</span>
            <input
              value={klicN}
              onChange={(e) => setKlicN(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
          <label className="block">
            <span className="font-semibold">{texty[jazyk].keyE}:</span>
            <input
              value={klicE}
              onChange={(e) => setKlicE(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
          <label className="block">
            <span className="font-semibold">{texty[jazyk].keyD}:</span>
            <input
              value={klicD}
              onChange={(e) => setKlicD(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
        </div>

        <div className="mb-4">
          <label className="block font-semibold">
            {texty[jazyk].mode}:
            <select
              value={rezimSifrovani ? "sifrovat" : "desifrovat"}
              onChange={(e) => setRezimSifrovani(e.target.value === "sifrovat")}
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="sifrovat">{texty[jazyk].encryptMode}</option>
              <option value="desifrovat">{texty[jazyk].decryptMode}</option>
            </select>
          </label>
        </div>

        <button
          onClick={zpracujZpravu}
          className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          {rezimSifrovani ? texty[jazyk].encryptMode : texty[jazyk].decryptMode}
        </button>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">{texty[jazyk].result}:</h2>
          <p className="whitespace-pre-wrap break-words">{zasifrovanaZprava}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
import { useState } from "react";

const indikatorovaMapa = {
  ADFGX: ["A", "D", "F", "G", "X"],
  ADFGVX: ["A", "D", "F", "G", "V", "X"],
};

const zastupceMezera = "XMEZERAY";
const zastupciCisla = [
  "XNULAY",
  "XEDNAY",
  "XDVAY",
  "XTRIY",
  "XCTYRIY",
  "XPETY",
  "XSHESTY",
  "XSEDMY",
  "XOSMY",
  "XDEVETY",
];

function aplikujZastupce(text: string, typSifry: "ADFGX" | "ADFGVX"): string {
  if (!text.length) return "";
  const prvniZnak = text[0];
  const zbytek = text.slice(1);

  if (prvniZnak === " ") {
    return zastupceMezera + aplikujZastupce(zbytek, typSifry);
  } else if (/\d/.test(prvniZnak)) {
    if (parseInt(prvniZnak) >= 0 && parseInt(prvniZnak) < zastupciCisla.length) {
      return zastupciCisla[parseInt(prvniZnak)] + aplikujZastupce(zbytek, typSifry);
    } else {
      throw new Error(`Špatné číslo: ${prvniZnak}`);
    }
  } else {
    return prvniZnak + aplikujZastupce(zbytek, typSifry);
  }
}

function vratZastupce(text: string, typSifry: "ADFGX" | "ADFGVX"): string {
  let vysledek = text;
  vysledek = vysledek.replace(new RegExp(zastupceMezera, "g"), " ");

  zastupciCisla.forEach((zastupce, index) => {
    const regex = new RegExp(zastupce, "g");
    vysledek = vysledek.replace(regex, index.toString());
  });

  return vysledek;
}

function pripravVstup(text: string, typSifry: "ADFGX" | "ADFGVX"): string {
  let zpracovanyText = text.toUpperCase();

  const nahrazky: { [key: string]: string } = {
    Á: "A",
    À: "A",
    Â: "A",
    Ä: "A",
    Č: "C",
    Ď: "D",
    É: "E",
    È: "E",
    Ê: "E",
    Ë: "E",
    Ě: "E",
    Í: "I",
    Ì: "I",
    Î: "I",
    Ï: "I",
    Ň: "N",
    Ó: "O",
    Ò: "O",
    Ô: "O",
    Ö: "O",
    Ř: "R",
    Š: "S",
    Ť: "T",
    Ú: "U",
    Ù: "U",
    Û: "U",
    Ü: "U",
    Ý: "Y",
    Ž: "Z",
  };

  zpracovanyText = zpracovanyText
    .split("")
    .map((char) => nahrazky[char] || char)
    .join("");

  if (typSifry === "ADFGX") {
    zpracovanyText = zpracovanyText.replace(/J/g, "I");
    zpracovanyText = zpracovanyText.replace(/[^A-Z0-9 ]/g, "");
  } else if (typSifry === "ADFGVX") {
    zpracovanyText = zpracovanyText.replace(/[^A-Z0-9 ]/g, "");
  }

  zpracovanyText = aplikujZastupce(zpracovanyText, typSifry);

  return zpracovanyText;
}

function generujPolybiuvCtverec(
  klic: string,
  typSifry: "ADFGX" | "ADFGVX"
): string[][] {
  const velikost = typSifry === "ADFGX" ? 5 : 6;
  let symboly = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  if (typSifry === "ADFGX") {
    symboly = symboly.replace(/J/g, "I");
  } else {
    symboly += "0123456789";
  }

  const jedineSymboly: string[] = [];

  for (const char of klic.toUpperCase()) {
    if (!jedineSymboly.includes(char) && symboly.includes(char)) {
      jedineSymboly.push(char);
    }
  }

  for (const char of symboly) {
    if (!jedineSymboly.includes(char)) {
      jedineSymboly.push(char);
    }
  }

  while (jedineSymboly.length < velikost * velikost) {
    for (const char of symboly) {
      if (!jedineSymboly.includes(char)) {
        jedineSymboly.push(char);
        if (jedineSymboly.length === velikost * velikost) break;
      }
    }
    if (jedineSymboly.length === jedineSymboly.length) break;
  }

  const maticeList = jedineSymboly.slice(0, velikost * velikost);

  const matice: string[][] = [];
  for (let i = 0; i < velikost; i++) {
    const radek: string[] = [];
    for (let j = 0; j < velikost; j++) {
      radek.push(maticeList[i * velikost + j]);
    }
    matice.push(radek);
  }

  return matice;
}

function zasifrujText(
  text: string,
  matice: string[][],
  typSifry: "ADFGX" | "ADFGVX"
): string {
  if (!text.length) return "";

  const indikatory = indikatorovaMapa[typSifry];
  const zakodovanyIndicators: string[] = [];

  const charPositionMap: { [key: string]: [number, number] } = {};

  matice.forEach((radek, rowIndex) => {
    radek.forEach((znak, colIndex) => {
      charPositionMap[znak] = [rowIndex, colIndex];
    });
  });

  for (const znak of text) {
    const pozice = charPositionMap[znak];
    const [radek, sloupec] = pozice;
    zakodovanyIndicators.push(indikatory[radek], indikatory[sloupec]);
  }

  return zakodovanyIndicators.join("");
}

function sloupcovaTranspozice(text: string, klic: string): string {
  if (klic.length === 0) return text;

  const klicSUnikatnimId = klic.split("").map((znak, idx) => ({
    znak,
    puvodniIndex: idx,
    unikateId: idx, 
  }));

  const serazenyKlic = [...klicSUnikatnimId].sort((a, b) => {
    if (a.znak < b.znak) return -1;
    if (a.znak > b.znak) return 1;
    return a.puvodniIndex - b.puvodniIndex;
  });

  const serazenePoradiNaPuvodniIndex = serazenyKlic.map(item => item.puvodniIndex);

  const sloupce: string[] = new Array(klic.length).fill("");

  for (let i = 0; i < text.length; i++) {
    const aktualniSloupec = i % klic.length;
    sloupce[aktualniSloupec] += text[i];
  }

  const sifrovanyText = serazenePoradiNaPuvodniIndex
    .map(sloupecIndex => sloupce[sloupecIndex])
    .join("");

  return sifrovanyText;
}


function inverzniSloupcovaTranspozice(text: string, klic: string): string {
  if (!klic.length) return text;

  const klicoveZnaky = klic.split("");
  const poradiKlice = klicoveZnaky
    .map((znak, index) => ({ znak, index }))
    .sort((a, b) =>
      a.znak.localeCompare(b.znak) || a.index - b.index
    );

  const pocetSloupcu = klic.length;
  const pocetRadku = Math.ceil(text.length / pocetSloupcu);
  const delkySloupcu = Array(pocetSloupcu).fill(pocetRadku);

  const kratkeSloupce = pocetRadku * pocetSloupcu - text.length;

  const sloupceNaOdstraneni = Array.from({ length: kratkeSloupce }, (_, i) => pocetSloupcu - 1 - i);

  const upraveneDelkySloupcu = delkySloupcu.map((delka, idx) =>
    sloupceNaOdstraneni.includes(idx) ? delka - 1 : delka
  );

  const sortedDelky = poradiKlice.map(({ index }) => upraveneDelkySloupcu[index]);

  const zacatek = sortedDelky.reduce((acc, delka) => {
    const posledni = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(posledni + delka);
    return acc;
  }, [] as number[]);

  const slices = sortedDelky.map((delka, i) => {
    const start = i === 0 ? 0 : zacatek[i - 1];
    return text.substr(start, delka).split("");
  });

  const sloupce = poradiKlice.reduce((acc, { index }, i) => {
    acc[index] = slices[i];
    return acc;
  }, [] as string[][]);

  const vysledek = Array.from({ length: pocetRadku }, (_, radek) =>
    Array.from({ length: pocetSloupcu }, (_, sloupec) => sloupce[sloupec]?.[radek] || "")
      .join("")
  ).join("");

  return vysledek;
}


function desifrujText(
  text: string,
  matice: string[][],
  typSifry: "ADFGX" | "ADFGVX"
): string {
  if (!text.length) return "";

  const indikatory = indikatorovaMapa[typSifry];

  if (text.length % 2 !== 0) {
    throw new Error("Délka zašifrovaného textu je neplatná.");
  }

  const pary = text.match(/.{2}/g);
  if (!pary) {
    throw new Error("Délka zašifrovaného textu je neplatná.");
  }

  const znaky = pary.map(pair => {
    //@ts-ignore
    const [radkovyIndikator, sloupcovyIndikator] = pair;
    const radek = indikatory.indexOf(radkovyIndikator);
    const sloupec = indikatory.indexOf(sloupcovyIndikator);
    const znak = matice[radek]?.[sloupec];
    return znak;
  });

  return znaky.join("");
}


const App = () => {
  const [jazyk, setJazyk] = useState<"cs" | "en">("cs");
  const [typSifry, settypSifry] = useState<"ADFGX" | "ADFGVX">("ADFGX");
  const [klic, setKlic] = useState("");
  const [sloupcovyKlic, setSloupcovyKlic] = useState("");
  const [zprava, setZprava] = useState("");
  const [zasifrovanyText, setZasifrovanyText] = useState("");
  const [desifrovanyText, setDesifrovanyText] = useState("");
  const [filtrovanyText, setFiltrovanyText] = useState("");
  const [matice, setMatice] = useState<string[][]>([]);
  const [substitucniText, setSubstitucniText] = useState("");

  const texty = {
    cs: {
      cs: "Česky",
      en: "Anglicky",
      title: "ADFGX/ADFGVX Šifra",
      encrypt: "Zašifruj",
      decrypt: "Dešifruj",
      key: "Klíč pro matici",
      columnKey: "Klíč pro sloupcovou transpozici",
      message: "Zpráva",
      encryptAction: "Zašifrovat",
      decryptAction: "Dešifrovat",
      filtered: "Filtrový text",
      encryptedText: "Zašifrovaný text",
      decryptedText: "Dešifrovaný text",
      matrix: "Polybiův čtverec",
      revertedText: "Zpětně upravený text",
    },
    en: {
      cs: "Czech",
      en: "English",
      title: "ADFGX/ADFGVX Cipher",
      encrypt: "Encrypt",
      decrypt: "Decrypt",
      key: "Matrix Key",
      columnKey: "Columnar Transposition Key",
      message: "Message",
      encryptAction: "Encrypt",
      decryptAction: "Decrypt",
      filtered: "Filtered text",
      encryptedText: "Encrypted text",
      decryptedText: "Decrypted text",
      matrix: "Polybius Square",
      revertedText: "Reverted text",
    },
  };

  const prepinaniJazyka = (lang: "cs" | "en") => {
    setJazyk(lang);
  };

  const zpracujSifrovani = () => {
    try {
      const pripravenaZprava = pripravVstup(zprava, typSifry);
      setFiltrovanyText(pripravenaZprava);

      const pripravenaKlic = pripravVstup(klic, typSifry).replace(/[^A-Z0-9]/g, "");
      const cipherMatice = generujPolybiuvCtverec(pripravenaKlic, typSifry);
      setMatice(cipherMatice);

      const substituce = zasifrujText(pripravenaZprava, cipherMatice, typSifry);
      setSubstitucniText(substituce);

      const pripravenaSloupcovaKlic = pripravVstup(sloupcovyKlic, typSifry).replace(/[^A-Z]/g, "");
      const zasifrovany = sloupcovaTranspozice(substituce, pripravenaSloupcovaKlic);
      setZasifrovanyText(zasifrovany);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(jazyk === "cs" ? "Došlo k neznámé chybě" : "An unknown error occurred");
      }
    }
  };

  const zpracujDesifrovani = () => {
    try {
      const pripravenaKlic = pripravVstup(klic, typSifry).replace(/[^A-Z0-9]/g, "");
      const cipherMatice = generujPolybiuvCtverec(pripravenaKlic, typSifry);
      setMatice(cipherMatice);

      const pripravenaSloupcovaKlic = pripravVstup(sloupcovyKlic, typSifry).replace(/[^A-Z]/g, "");
      const substituce = inverzniSloupcovaTranspozice(zasifrovanyText, pripravenaSloupcovaKlic);
      setSubstitucniText(substituce);

      const desifrovany = desifrujText(substituce, cipherMatice, typSifry);

      let finalDesifrovanyText = desifrovany;
      if (typSifry === "ADFGX" || typSifry === "ADFGVX") {
        finalDesifrovanyText = vratZastupce(desifrovany, typSifry);
      }

      setDesifrovanyText(finalDesifrovanyText);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(jazyk === "cs" ? "Došlo k neznámé chybě" : "An unknown error occurred");
      }
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

        <div className="mb-6">
          <label className="block font-semibold mb-1">
            {texty[jazyk].title}
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={typSifry}
            onChange={(e) => settypSifry(e.target.value as "ADFGX" | "ADFGVX")}
          >
            <option value="ADFGX">ADFGX</option>
            <option value="ADFGVX">ADFGVX</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              {texty[jazyk].encrypt}
            </h2>
            <input
              type="text"
              placeholder={texty[jazyk].key}
              className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={klic}
              onChange={(e) => setKlic(e.target.value)}
            />
            <input
              type="text"
              placeholder={texty[jazyk].columnKey}
              className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={sloupcovyKlic}
              onChange={(e) => setSloupcovyKlic(e.target.value)}
            />
            <textarea
              placeholder={texty[jazyk].message}
              className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={zprava}
              onChange={(e) => setZprava(e.target.value)}
            />
            <button
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-500 active:bg-indigo-700 transition"
              onClick={zpracujSifrovani}
            >
              {texty[jazyk].encryptAction}
            </button>
            
            <div className="mt-4">
              <label className="block text-gray-700 font-medium mb-1">
                {texty[jazyk].filtered}:
              </label>
              <textarea
                readOnly
                className="w-full h-24 p-2 border border-gray-300 rounded-md resize-y overflow-auto"
                value={filtrovanyText}
              />
            </div>
            
            {(typSifry === "ADFGX" || typSifry === "ADFGVX") && (
              <div className="mt-2">
                <label className="block text-gray-700 font-medium mb-1">
                  {texty[jazyk].revertedText}:
                </label>
                <textarea
                  readOnly
                  className="w-full h-24 p-2 border border-gray-300 rounded-md resize-y overflow-auto"
                  value={vratZastupce(filtrovanyText, typSifry)}
                />
              </div>
            )}
            
            <textarea
              readOnly
              placeholder={texty[jazyk].encryptedText}
              className="w-full p-4 mt-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={zasifrovanyText}
            />
          </div>

          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              {texty[jazyk].decrypt}
            </h2>
            <input
              type="text"
              placeholder={texty[jazyk].key}
              className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={klic}
              onChange={(e) => setKlic(e.target.value)}
            />
            <input
              type="text"
              placeholder={texty[jazyk].columnKey}
              className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={sloupcovyKlic}
              onChange={(e) => setSloupcovyKlic(e.target.value)}
            />
            <textarea
              placeholder={texty[jazyk].encryptedText}
              className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={zasifrovanyText}
              onChange={(e) => setZasifrovanyText(e.target.value)}
            />
            <button
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-500 active:bg-indigo-700 transition"
              onClick={zpracujDesifrovani}
            >
              {texty[jazyk].decryptAction}
            </button>
            <textarea
              readOnly
              placeholder={texty[jazyk].decryptedText}
              className="w-full p-4 mt-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={desifrovanyText}
            />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {texty[jazyk].matrix}
          </h2>
          <div
            className={`grid gap-2 ${
              typSifry === "ADFGX" ? "grid-cols-5" : "grid-cols-6"
            }`}
          >
            {matice.flat().map((znak, idx) => (
              <div
                key={idx}
                className="bg-indigo-200 text-indigo-900 text-lg font-bold flex justify-center items-center h-12 w-12 border border-indigo-400 rounded"
              >
                {znak}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
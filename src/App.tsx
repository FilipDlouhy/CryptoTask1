import { useState } from "react";
import { remove as removeDiacritics } from "diacritics";

type Jazyk = "cs" | "en";

const numberToPlaceholderMap: Record<number, string> = {
  0: "XNULAY",
  1: "XEDNAY",
  2: "XDVAY",
  3: "XTRIY",
  4: "XCTYRIY",
  5: "XPETY",
  6: "XSHESTY",
  7: "XSEDMY",
  8: "XOSMY",
  9: "XDEVETY",
};

const placeholderToNumberMap: Record<string, number> = {
  XNULAY: 0,
  XEDNAY: 1,
  XDVAY: 2,
  XTRIY: 3,
  XCTYRIY: 4,
  XPETY: 5,
  XSHESTY: 6,
  XSEDMY: 7,
  XOSMY: 8,
  XDEVETY: 9,
};

const texty: Record<
  Jazyk,
  {
    nadpis: string;
    zasifruj: string;
    dešifruj: string;
    klic: string;
    zprava: string;
    zasifrovat: string;
    dešifrovat: string;
    filtrovany: string;
    sifrovanyText: string;
    desifrovanyText: string;
    mrizka: string;
    jazyk: string;
    cesky: string;
    anglicky: string;
  }
> = {
  cs: {
    nadpis: "Playfair šifra v Reactu",
    zasifruj: "Zašifruj zprávu",
    dešifruj: "Dešifruj zprávu",
    klic: "Zadej klíč",
    zprava: "Zadej zprávu",
    zasifrovat: "Zašifrovat",
    dešifrovat: "Dešifrovat",
    filtrovany: "Filtrovaný text",
    sifrovanyText: "Zašifrovaný text se zobrazí zde...",
    desifrovanyText: "Dešifrovaný text se zobrazí zde...",
    mrizka: "Playfair mřížka",
    jazyk: "Jazyk",
    cesky: "Čeština",
    anglicky: "English",
  },
  en: {
    nadpis: "Playfair Cipher in React",
    zasifruj: "Encrypt Message",
    dešifruj: "Decrypt Message",
    klic: "Enter key",
    zprava: "Enter message",
    zasifrovat: "Encrypt",
    dešifrovat: "Decrypt",
    filtrovany: "Filtered Text",
    sifrovanyText: "Encrypted text will appear here...",
    desifrovanyText: "Decrypted text will appear here...",
    mrizka: "Playfair Matrix",
    jazyk: "Language",
    cesky: "Czech",
    anglicky: "English",
  },
};

function zasifrovatPlaceholdry(text: string): string {
  return text
    .replace(/ /g, "XMEZERAY")
    .replace(/\d/g, (digit) => numberToPlaceholderMap[parseInt(digit)]);
}

function rozsifrovatPlaceholdry(text: string): string {
  for (const placeholder in placeholderToNumberMap) {
    const regex = new RegExp(placeholder, "g");
    text = text.replace(regex, placeholderToNumberMap[placeholder].toString());
  }

  return text.replace(/XMEZERAY/g, " ");
}

function pripravVstup(text: string, jazyk: Jazyk): string {
  let prepped = removeDiacritics(text)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  prepped = zasifrovatPlaceholdry(prepped);

  if (jazyk === "en") {
    prepped = prepped.replace(/J/g, "I");
  } else if (jazyk === "cs") {
    prepped = prepped.replace(/W/g, "V");
  }

  return prepped;
}

function pripravKlic(klic: string, jazyk: Jazyk): string {
  let cleanedKey = removeDiacritics(klic)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  if (jazyk === "en") {
    cleanedKey = cleanedKey.replace(/J/g, "I");
  } else if (jazyk === "cs") {
    cleanedKey = cleanedKey.replace(/W/g, "V");
  }
  return cleanedKey;
}

function vytvorMrizku(klic: string, jazyk: Jazyk): string[][] {
  klic = pripravKlic(klic, jazyk); // Clean the key first
  let vysledek: string[] = [];

  for (let pismeno of klic) {
    if (!vysledek.includes(pismeno) && /[A-Z]/.test(pismeno)) {
      vysledek.push(pismeno);
    }
  }

  const abeceda =
    jazyk === "cs"
      ? "A B C D E F G H I J K L M N O P Q R S T U V X Y Z".replace(/\s+/g, "")
      : "A B C D E F G H I K L M N O P Q R S T U V W X Y Z".replace(/\s+/g, "");

  for (let pismeno of abeceda) {
    if (!vysledek.includes(pismeno)) {
      vysledek.push(pismeno);
    }
  }

  const mrizka: string[][] = [];
  for (let i = 0; i < 5; i++) {
    mrizka.push(vysledek.slice(i * 5, (i + 1) * 5));
  }

  return mrizka;
}

function najdiPoziciVMrizce(
  mrizka: string[][],
  pismeno: string,
  jazyk: Jazyk
): [number, number] {
  if (jazyk === "en" && pismeno === "J") pismeno = "I";
  if (jazyk === "cs" && pismeno === "W") pismeno = "V";
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (mrizka[i][j] === pismeno) {
        return [i, j];
      }
    }
  }
  throw new Error(`Písmeno ${pismeno} nebylo nalezeno v mřížce`);
}

function rozdeleniDvojic(text: string, jazyk: Jazyk): string {
  let vysledek = "";

  for (let i = 0; i < text.length; i += 2) {
    let a = text[i];
    let b = text[i + 1] || "X";

    if (b === "X" && i + 1 === text.length) {
      b = "G";
    }

    if (a === b) {
      b = "X";
      i--;
    }

    vysledek += a + b + " ";
  }

  return vysledek.trim();
}

function zasifruj(mrizka: string[][], zprava: string, jazyk: Jazyk): string {
  zprava = pripravVstup(zprava, jazyk);
  let vysledek = "";

  for (let i = 0; i < zprava.length; i += 2) {
    let a = zprava[i];
    let b = zprava[i + 1] || "X";

    if (a === b) {
      b = "X";
      i--;
    }

    const [aRadek, aSloupec] = najdiPoziciVMrizce(mrizka, a, jazyk);
    const [bRadek, bSloupec] = najdiPoziciVMrizce(mrizka, b, jazyk);

    if (aRadek === bRadek) {
      vysledek +=
        mrizka[aRadek][(aSloupec + 1) % 5] + mrizka[bRadek][(bSloupec + 1) % 5];
    } else if (aSloupec === bSloupec) {
      vysledek +=
        mrizka[(aRadek + 1) % 5][aSloupec] + mrizka[(bRadek + 1) % 5][bSloupec];
    } else {
      vysledek += mrizka[aRadek][bSloupec] + mrizka[bRadek][aSloupec];
    }
  }

  return vysledek;
}

function desifruj(
  mrizka: string[][],
  sifra: string,
  jazyk: Jazyk,
  originalLength: number
): string {
  sifra = sifra.replace(/\s+/g, "").toUpperCase();
  let vysledek = "";

  for (let i = 0; i < sifra.length; i += 2) {
    const a = sifra[i];
    const b = sifra[i + 1];

    const [aRadek, aSloupec] = najdiPoziciVMrizce(mrizka, a, jazyk);
    const [bRadek, bSloupec] = najdiPoziciVMrizce(mrizka, b, jazyk);

    if (aRadek === bRadek) {
      vysledek +=
        mrizka[aRadek][(aSloupec + 4) % 5] + mrizka[bRadek][(bSloupec + 4) % 5];
    } else if (aSloupec === bSloupec) {
      vysledek +=
        mrizka[(aRadek + 4) % 5][aSloupec] + mrizka[(bRadek + 4) % 5][bSloupec];
    } else {
      vysledek += mrizka[aRadek][bSloupec] + mrizka[bRadek][aSloupec];
    }
  }

  const cleanedText = vysledek.slice(0, originalLength);

  return rozsifrovatPlaceholdry(cleanedText);
}

function App() {
  const [klic, nastavKlic] = useState<string>("");
  const [zprava, nastavZpravu] = useState<string>("");
  const [sifrovanyText, nastavSifrovanyText] = useState<string>("");
  const [desifrovanyText, nastavDesifrovanyText] = useState<string>("");
  const [filtrovanyText, nastavFiltrovanyText] = useState<string>("");
  const [jazyk, nastavJazyk] = useState<Jazyk>("en");

  const mrizka = vytvorMrizku(klic, jazyk);

  const zpracujSifrovani = () => {
    const pripravenyText = pripravVstup(zprava, jazyk);
    if (pripravenyText.length === 0) {
      return;
    }
    const dvojice = rozdeleniDvojic(pripravenyText, jazyk);
    nastavFiltrovanyText(dvojice);
    const zasifrovane = zasifruj(mrizka, pripravenyText, jazyk);
    nastavSifrovanyText(zasifrovane);
  };

  const zpracujDesifrovani = () => {
    const pripravenyZprava = pripravVstup(zprava, jazyk);
    const desifrovane = desifruj(
      mrizka,
      sifrovanyText,
      jazyk,
      pripravenyZprava.length
    );
    const textWithPlaceholdersReversed = rozsifrovatPlaceholdry(desifrovane);
    nastavDesifrovanyText(textWithPlaceholdersReversed);
  };

  const prepnoutJazyk = (novyJazyk: Jazyk) => {
    nastavJazyk(novyJazyk);
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
            onClick={() => prepnoutJazyk("cs")}
          >
            {texty[jazyk].cesky}
          </button>
          <button
            className={`px-3 py-1 rounded ${
              jazyk === "en"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => prepnoutJazyk("en")}
          >
            {texty[jazyk].anglicky}
          </button>
        </div>

        <h1 className="text-4xl font-bold text-center text-indigo-800 mb-8">
          {texty[jazyk].nadpis}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              {texty[jazyk].zasifruj}
            </h2>
            <input
              type="text"
              placeholder={texty[jazyk].klic}
              className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={klic}
              onChange={(e) => nastavKlic(e.target.value)}
            />
            <textarea
              placeholder={texty[jazyk].zprava}
              className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={zprava}
              onChange={(e) => nastavZpravu(e.target.value)}
            />
            <button
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-500 active:bg-indigo-700 transition"
              onClick={zpracujSifrovani}
            >
              {texty[jazyk].zasifrovat}
            </button>
            <p className="mt-4 text-gray-700">
              {texty[jazyk].filtrovany}: {filtrovanyText}
            </p>
            <textarea
              readOnly
              placeholder={texty[jazyk].sifrovanyText}
              className="w-full p-4 mt-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={sifrovanyText}
            />
          </div>

          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              {texty[jazyk].dešifruj}
            </h2>
            <textarea
              placeholder={texty[jazyk].sifrovanyText}
              className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={sifrovanyText}
              onChange={(e) => nastavSifrovanyText(e.target.value)}
            />
            <button
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-500 active:bg-indigo-700 transition"
              onClick={zpracujDesifrovani}
            >
              {texty[jazyk].dešifrovat}
            </button>
            <textarea
              readOnly
              placeholder={texty[jazyk].desifrovanyText}
              className="w-full p-4 mt-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              value={desifrovanyText}
            />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {texty[jazyk].mrizka}
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {mrizka.flat().map((pismeno, idx) => (
              <div
                key={idx}
                className="bg-indigo-200 text-indigo-900 text-lg font-bold flex justify-center items-center h-12 w-12 border border-indigo-400 rounded"
              >
                {pismeno}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

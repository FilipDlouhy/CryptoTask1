import { useState } from "react";

// Deklarace modulu diacritics, pokud není k dispozici v @types
import { remove as removeDiacritics } from "diacritics";

function nsd(a: number, b: number): number {
  return b === 0 ? a : nsd(b, a % b);
}

function modularniInverze(a: number, m: number, i: number = 1): number | null {
  if (i >= m) {
    return null; 
  }
  if ((a * i) % m === 1) {
    return i; 
  }
  return modularniInverze(a, m, i + 1); 
}

// Pomocná funkce pro vyčištění a přípravu vstupního textu
function pripravVstup(text: string): string {
  return removeDiacritics(text) 
    .toUpperCase() 
    .replace(/[^A-Z0-9 ]/g, ""); 
}

// Funkce pro zakódování pomocí afiní šifry
// Používá vzorec: (a * x + b) % velikostAbecedy
const abeceda = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const cisla = "0123456789";

function afinniSifraZakoduj(plainText: string, a: number, b: number): string {
  if (nsd(a, abeceda.length) !== 1) {
    throw new Error("Koeficient 'a' musí být nesoudělný s velikostí abecedy (26)");
  }

  const filtrovanyText = pripravVstup(plainText);

  let zakodovanyText = "";
  for (let i = 0; i < filtrovanyText.length; i++) {
    let char = filtrovanyText[i];
  
    if (abeceda.includes(char)) {
      const x = abeceda.indexOf(char);
      const zakodovanyChar = (a * x + b) % abeceda.length;
      zakodovanyText += abeceda[zakodovanyChar];
    } 
    else if (cisla.includes(char)) {
      const x = cisla.indexOf(char);
      const zakodovanyChar = (a * x + b) % cisla.length;
      zakodovanyText += cisla[zakodovanyChar];
    }
    else {
      zakodovanyText += char === " " ? "ZOGBG" : char;
    }
  }

  return zakodovanyText;
}

// Funkce pro dešifrování pomocí afiní šifry
// Používá vzorec: a_inv * (y - b) % velikostAbecedy
function afinniSifraDesifruj(cipherText: string, a: number, b: number): string {
  const a_inv = modularniInverze(a, abeceda.length);
  if (a_inv === null) {
    throw new Error("Koeficient 'a' nemá modulární inverzi, dešifrování není možné");
  }

  const filtrovanyText = cipherText.replace(/ZOGBG/g, " ");

  let desifrovanyText = "";
  for (let i = 0; i < filtrovanyText.length; i++) {
    let char = filtrovanyText[i];
  
    if (abeceda.includes(char)) {
      const y = abeceda.indexOf(char);
      const desifrovanyChar = (a_inv * (y - b + abeceda.length)) % abeceda.length;
      desifrovanyText += abeceda[desifrovanyChar];
    }
    else if (cisla.includes(char)) {
      const y = cisla.indexOf(char);
      const desifrovanyChar = (a_inv * (y - b + cisla.length)) % cisla.length;
      desifrovanyText += cisla[desifrovanyChar];
    }
    else {
      desifrovanyText += char;
    }
  }

  return desifrovanyText;
}

function App() {
  const [textKZakodovani, setTextKZakodovani] = useState<string>("");
  const [zakodovanyText, setZakodovanyText] = useState<string>("");
  const [textKDesifrovani, setTextKDesifrovani] = useState<string>("");
  const [desifrovanyText, setDesifrovanyText] = useState<string>("");
  const [a, setA] = useState<number>(1); 
  const [b, setB] = useState<number>(2); 

  const zakodovat = () => {
    try {
      const vysledek = afinniSifraZakoduj(textKZakodovani, a, b);
      setZakodovanyText(vysledek);
    } catch (error: any) {
      alert(error.message); 
    }
  };

  const desifrovat = () => {
    try {
      const vysledek = afinniSifraDesifruj(textKDesifrovani, a, b);
      setDesifrovanyText(vysledek);
    } catch (error: any) {
      alert(error.message); 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-500 to-indigo-500 flex flex-col justify-center items-center py-10">
      <div className="bg-white rounded-lg shadow-lg p-10 w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center text-indigo-800 mb-8">
          Afiní šifra: Zakódování/Dešifrování
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Zakódovat text</h2>
            <textarea
              id="text-k-zakodovani"
              className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 mb-4"
              placeholder="Zadejte text k zakódování..."
              value={textKZakodovani}
              onChange={(e) => setTextKZakodovani(e.target.value)}
            />
            <div className="flex gap-4 mb-4">
              <div className="flex flex-col w-1/2">
                <label htmlFor="koeficient-a" className="text-lg font-medium text-gray-700">
                  Koeficient A
                </label>
                <input
                  type="number"
                  id="koeficient-a"
                  className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={a}
                  onChange={(e) => setA(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col w-1/2">
                <label htmlFor="koeficient-b" className="text-lg font-medium text-gray-700">
                  Koeficient B
                </label>
                <input
                  type="number"
                  id="koeficient-b"
                  className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={b}
                  onChange={(e) => setB(Number(e.target.value))}
                />
              </div>
            </div>
            <button
              onClick={zakodovat}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-500 active:bg-indigo-700 transition"
            >
              Zakódovat
            </button>
            <textarea
              id="zakodovany-text"
              className="w-full mt-4 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Zakódovaný text se objeví zde..."
              value={zakodovanyText}
              readOnly
            />
          </div>

          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dešifrovat text</h2>
            <textarea
              id="text-k-desifrovani"
              className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 mb-4"
              placeholder="Zadejte text k dešifrování..."
              value={textKDesifrovani}
              onChange={(e) => setTextKDesifrovani(e.target.value)}
            />
            <button
              onClick={desifrovat}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-500 active:bg-indigo-700 transition"
            >
              Dešifrovat
            </button>
            <textarea
              id="desifrovany-text"
              className="w-full mt-4 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Dešifrovaný text se objeví zde..."
              value={desifrovanyText}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
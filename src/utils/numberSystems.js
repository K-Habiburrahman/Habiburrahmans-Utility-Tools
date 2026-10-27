export const NUMBER_SYSTEMS = [
  { value: "10", label: "Decimal" },
  { value: "2", label: "Binary" },
  { value: "8", label: "Octal" },
  { value: "16", label: "Hexadecimal" },
  { value: "bcd", label: "BCD" },
  { value: "gray", label: "Gray code" },
  { value: "roman", label: "Roman numerals" },
  { value: "arabicIndic", label: "Arabic-Indic numerals" },
  { value: "ascii", label: "ASCII text" },
  { value: "other", label: "Other base (2–36)" },
];

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function parseInteger(value, base) {
  const negative = value.startsWith("-");
  const digits = negative || value.startsWith("+") ? value.slice(1) : value;
  if (!digits) throw Error(`"${value}" is not a valid integer.`);

  let result = 0n;
  for (const char of digits.toLowerCase()) {
    const digit = parseInt(char, 36);
    if (Number.isNaN(digit) || digit >= base) {
      throw Error(`"${value}" contains a digit that is invalid for base ${base}.`);
    }
    result = result * BigInt(base) + BigInt(digit);
  }
  return negative ? -result : result;
}

function parseBcd(value) {
  const bits = value.replace(/\s+/g, "");
  if (!bits || !/^[01]+$/.test(bits) || bits.length % 4 !== 0) {
    throw Error("BCD input must contain groups of four bits.");
  }
  const digits = bits.match(/.{4}/g).map((group) => {
    const digit = parseInt(group, 2);
    if (digit > 9) throw Error(`"${group}" is not a valid BCD digit.`);
    return digit;
  });
  return BigInt(digits.join(""));
}

function parseGray(value) {
  if (!/^[01]+$/.test(value)) throw Error("Gray code input must contain only 0 and 1.");
  let gray = BigInt(`0b${value}`);
  let binary = gray;
  while (gray >>= 1n) binary ^= gray;
  return binary;
}

function parseRoman(value) {
  const roman = value.toUpperCase();
  if (!/^[IVXLCDM]+$/.test(roman)) throw Error("Enter a valid Roman numeral from I to MMMCMXCIX.");
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let result = 0;
  for (let i = 0; i < roman.length; i++) {
    const current = values[roman[i]];
    const next = values[roman[i + 1]] || 0;
    result += current < next ? -current : current;
  }
  if (result < 1 || result > 3999 || toRoman(BigInt(result)) !== roman) {
    throw Error("Enter a valid Roman numeral from I to MMMCMXCIX.");
  }
  return BigInt(result);
}

function toRoman(value) {
  if (value < 1n || value > 3999n) {
    throw Error("Roman numerals support whole numbers from 1 to 3999.");
  }
  const numerals = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let number = Number(value);
  let result = "";
  for (const [amount, numeral] of numerals) {
    while (number >= amount) {
      result += numeral;
      number -= amount;
    }
  }
  return result;
}

function parseArabicIndic(value) {
  const digits = Array.from(value, (character) => {
    const digit = ARABIC_INDIC_DIGITS.indexOf(character);
    return digit < 0 ? character : String(digit);
  }).join("");
  return parseInteger(digits, 10);
}

function parseNumber(value, system, customBase) {
  if (system === "bcd") return parseBcd(value);
  if (system === "gray") return parseGray(value);
  if (system === "roman") return parseRoman(value);
  if (system === "arabicIndic") return parseArabicIndic(value);
  return parseInteger(value, getBase(system, customBase));
}

function formatNumber(value, system, customBase) {
  if (system === "bcd") {
    if (value < 0n) throw Error("BCD supports non-negative integers only.");
    return value.toString().split("").map((digit) => Number(digit).toString(2).padStart(4, "0")).join(" ");
  }
  if (system === "gray") {
    if (value < 0n) throw Error("Gray code supports non-negative integers only.");
    return (value ^ (value >> 1n)).toString(2);
  }
  if (system === "roman") return toRoman(value);
  if (system === "arabicIndic") {
    return value.toString().replace(/\d/g, (digit) => ARABIC_INDIC_DIGITS[Number(digit)]);
  }
  return value.toString(getBase(system, customBase));
}

function getBase(system, customBase) {
  const base = system === "other" ? Number(customBase) : Number(system);
  if (!Number.isInteger(base) || base < 2 || base > 36) {
    throw Error("Choose a custom base between 2 and 36.");
  }
  return base;
}

export function convertNumberSystem(input, from, to, fromCustomBase, toCustomBase) {
  if (from === "ascii" && to === "ascii") {
    throw Error("Choose a numeric system for either the source or destination.");
  }

  if (from === "ascii") {
    if (!input) throw Error("Enter ASCII text to convert.");
    const codes = Array.from(input, (character) => character.codePointAt(0));
    if (codes.some((code) => code > 127)) {
      throw Error("ASCII input can only contain characters from 0 to 127.");
    }
    const output = codes.map((code) => formatNumber(BigInt(code), to, toCustomBase));
    return output.join(to === "bcd" || to === "gray" || to === "roman" ? ", " : " ");
  }

  const specializedSource = ["bcd", "gray", "roman", "arabicIndic"].includes(from);
  const inputValue = input.trim();
  if (!inputValue) throw Error("Enter a number to convert.");
  const values = specializedSource
    ? from === "bcd"
      ? inputValue.split(/\s*,\s*/).map((token) => parseNumber(token, from, fromCustomBase))
      : inputValue.split(/[,\s]+/).map((token) => parseNumber(token, from, fromCustomBase))
    : inputValue.split(/[\s,]+/).map((token) => parseNumber(token, from, fromCustomBase));

  if (to === "ascii") {
    const codes = values.map((value) => {
      if (value < 0n || value > 127n) {
        throw Error("ASCII character codes must be between 0 and 127.");
      }
      return Number(value);
    });
    return codes.map((code) => String.fromCharCode(code)).join("");
  }

  const output = values.map((value) => formatNumber(value, to, toCustomBase));
  return output.join(to === "bcd" || to === "gray" || to === "roman" ? ", " : " ");
}

import { createInterface } from "readline";
import { readFile } from "fs/promises";
import chalk from "chalk";

const STDIN = process.stdin;
const STDOUT = process.stdout;

const READ_LINE = createInterface({
  input: STDIN,
  output: STDOUT,
});

const ask = async (question: string, defaultAnswer?: string) =>
  new Promise<string>((resolve, reject) => {
    let questionOutput = `${chalk.cyan(question)} `;

    if (defaultAnswer !== undefined)
      questionOutput += `[${chalk.yellow(defaultAnswer)}] `;

    const cb = (answer: string) => {
      const answerValue = answer.trim();

      if (answerValue === "")
        defaultAnswer === undefined
          ? READ_LINE.question(questionOutput, cb)
          : resolve(defaultAnswer);
      else resolve(answerValue);
    };

    READ_LINE.question(questionOutput, cb);
  });

const QUESTION_1 = `Enter letters you have guessed so far
 - Enter dot for missed letter
 - Enter lowercase for guessed letter in the wrong place
 - Enter uppercase for guessed letter in the correct place

: `;

const QUESTION_2 = "Enter all missed letters: ";

const isUpperCase = (str: string) =>
  str === str.toLocaleUpperCase() && str !== str.toLocaleLowerCase();

type Guessed = {
  guessedWrongPlace: string[];
  guessedCorrectPlace: {
    [key: number]: string;
  };
};

const rechkoHelper = async () => {
  const guessed = await ask(QUESTION_1);

  const guessedObj = [...guessed].reduce<Guessed>(
    (acc, curr) => {
      if (curr !== ".") {
        if (isUpperCase(curr)) {
          const index = guessed.indexOf(curr);
          acc.guessedCorrectPlace[index] = curr.toLocaleLowerCase();
        } else {
          acc.guessedWrongPlace.push(curr);
        }
      }

      return acc;
    },
    { guessedWrongPlace: [], guessedCorrectPlace: {} }
  );

  const wrongPlaceRegex =
    guessedObj.guessedWrongPlace.length > 0
      ? new RegExp(`[${guessedObj.guessedWrongPlace.join("")}]`)
      : null;

  const missed = await ask(QUESTION_2);
  const missedRegex = new RegExp(`[${missed.toLocaleLowerCase()}]`);

  READ_LINE.close();

  const words5FileContents = await readFile("resources/words5-rs.txt", "utf-8");
  const words = words5FileContents.split(/[\r\n]+/);

  const possibleWords = words.filter((word) => {
    // Exclude all words that contain missed letters
    if (missedRegex.exec(word)) return false;

    // Exclude all words that do not contain all guessed letters at the correct place
    const hasAllCorrectPlaceLetters = Object.keys(
      guessedObj.guessedCorrectPlace
    ).every((key) => {
      const keyNumber = parseInt(key);
      const letter = guessedObj.guessedCorrectPlace[keyNumber];
      return word[keyNumber] === letter;
    });

    if (!hasAllCorrectPlaceLetters) return false;

    // Exclude all word that do not contain any of the guessed letters at the wrong place
    return !(wrongPlaceRegex && !wrongPlaceRegex.exec(word));
  });

  console.dir(possibleWords, { depth: null, maxArrayLength: 1000 });
};

rechkoHelper();

/* eslint no-param-reassign: 0 */
/* eslint no-prototype-builtins: 0 */
/* eslint max-len: 0 */
/* eslint no-restricted-globals: 0 */
/* eslint no-undef: 0 */
import crypto from 'crypto';

// Generates a random number
const randomNumber = max =>
  crypto.randomBytes(1)[0] % max;

// Possible combinations
const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers = '0123456789';
const symbols = '!@#$%^&*()+_-=}{[]|:;"/?.><,`~';
const similarCharacters = /[ilLI|`oO0]/g;
const strictRules = [
  { name: 'lowercase', rule: /[a-z]/ },
  { name: 'uppercase', rule: /[A-Z]/ },
  { name: 'numbers', rule: /[0-9]/ },
  { name: 'symbols', rule: /[!@#$%^&*()+_\-=}{[\]|:;"/?.><,`~]/ },
];

const generate = (options, pool) => {
  let password = '';
  const optionsLength = options.length;
  const poolLength = pool.length;

  for (let i = 0; i < optionsLength; i++) {
    password += pool[randomNumber(poolLength)];
  }

  if (options.strict) {
    // Iterate over each rule, checking to see if the password works.
    const fitsRules = strictRules.reduce((result, rule) => {
      // Skip checking the rule if we know it doesn't match.
      if (result === false) return false;

      // If the option is not checked, ignore it.
      if (options[rule.name] === false) return result;

      // Run the regex on the password and return whether
      // or not it matches.
      return rule.rule.test(password);
    }, true);

    // If it doesn't fit the rules, generate a new one (recursion).
    if (!fitsRules) return generate(options, pool);
  }

  return password;
};

// Generate a random password.
export const generatePassword = (options) => {
  // Set defaults.
  options = options || {};
  if (!options.hasOwnProperty('length')) options.length = 10;
  if (!options.hasOwnProperty('numbers')) options.numbers = false;
  if (!options.hasOwnProperty('symbols')) options.symbols = false;
  if (!options.hasOwnProperty('exclude')) options.exclude = '';
  if (!options.hasOwnProperty('uppercase')) options.uppercase = true;
  if (!options.hasOwnProperty('excludeSimilarCharacters')) options.excludeSimilarCharacters = false;
  if (!options.hasOwnProperty('strict')) options.strict = false;

  if (options.strict) {
    const minStrictLength = 1 + (options.numbers ? 1 : 0) + (options.symbols ? 1 : 0) + (options.uppercase ? 1 : 0);
    if (minStrictLength > options.length) {
      throw new TypeError('Length must correlate with strict guidelines');
    }
  }

  // Generate character pool
  let pool = lowercase;

  // uppercase
  if (options.uppercase) {
    pool += uppercase;
  }
  // numbers
  if (options.numbers) {
    pool += numbers;
  }
  // symbols
  if (options.symbols) {
    pool += symbols;
  }

  // similar characters
  if (options.excludeSimilarCharacters) {
    pool = pool.replace(similarCharacters, '');
  }

  // excludes characters from the pool
  let i = options.exclude.length;
  while (i--) {
    pool = pool.replace(options.exclude[i], '');
  }

  const password = generate(options, pool);

  return password;
};

// Generates multiple passwords at once with the same options.
export const generateMultiple = (amount, options) => {
  const passwords = [];

  for (let i = 0; i < amount; i++) {
    passwords[i] = self.generate(options);
  }

  return passwords;
};

/**
 * @param {string} text 
 * @returns {Array<string>} array of urls found inside the text
 */
export function parseUrlFromText(text) {
  // Grab everything inside outermost brackets.
  const outermostBracketsArray = text.match(/[^\\]\[(.*[^\\])\]/g);
  if (outermostBracketsArray === null) {
    return [];
  }
  
  const textInsideBrackets = outermostBracketsArray[0];

  // Regex found on https://stackoverflow.com/a/3809435.
  const urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  const urlsInsideBrackets = textInsideBrackets.match(urlRegex);
  if(urlsInsideBrackets === null) {
    return [];
  }
  
  return [urlsInsideBrackets[urlsInsideBrackets.length - 1]]
}

function stringToRegex(str) {
    // Main regex
    const main = str.match(/\/(.+)\/.*/)[1]
  
    // Regex options
    const options = str.match(/\/.+\/(.*)/)[1]
  
    // Compiled regex
    return new RegExp(main, options)
  }
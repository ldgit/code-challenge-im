# Code challenge

A code challenge made for a job application.

## Requirements

- Node.js v20+
- npm v10+

## Usage instructions

### Installation

1. Clone this repository and `cd` into it.
2. Run `npm ci` to install npm packages.
3. Run the script.

### Running the script

This script uses `IM_SECRET` env variable as a secret key for hashing, and will fail without it.

You can ensure it is set for your current session by calling `export IM_SECRET=your_secret_key` **before** running the script.

There are several ways to run the script:
- `node ./index ./path/to/file.txt` - parse a txt file
- `node ./index` - if no file path is provided the script will parse the input from `stdin` line by line
- `node ./index.js -h` or `./index.js --help` for complete instructions 

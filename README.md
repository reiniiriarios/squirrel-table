# SquirrelTable

SquirrelTable is a desktop application that can run MySQL queries over SSH and generate CSV files. Useful for QA where queries need to be run repeatedly and CSV files handed off. Typical usage within a team might be to have a directory of SQL files syncing over cloud storage that one person can update and other people can simply open SquirrelTable and run as they need.

## Releases

releases coming soon

## Getting Started

to do

## Known Issues

* SQL syntax highlighter sometimes truncates code (does not effect running the query)

## To Do

* Auto-refresh when files in directory change
* SQL editor

## Running & Making from Source

SquirrelTable is built in [Node.js](https://nodejs.org/) on [Electron](https://www.electronjs.org/) with [Electron Forge](https://www.electronforge.io/).

After installing Node.js, if not installed:

`git clone https://github.com/reiniiriarios/squirrel-table.git`

`cd squirrel-table`

`npm install`

### To Run

`npm start`

### To Make

See `forge.config.js` for make settings

`npm run make`

## Why "SquirrelTable?"
SQL...SQuirreL :3

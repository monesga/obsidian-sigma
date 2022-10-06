# Obsidian Sigma

## About
A plugin to enable using obsidian note code blocks as calculation sheets

## Features
- Block totals
- Hierarchy and subtotals
- Basic math expressions
- Variables
- Supported on desktop and mobile

## Usages
- Financial planning
- Expense tracking
- Miscllaneous calculations

## Guide
- All lines must be contained in a `sigma` code block
- A line that end in a math expression evaluates that expression
- Math expressions cannot contain embedded spaces
- The expression must be the last word on a given line
- And preceeded by one or more spaces
- Hierarchy is supported by using indentation
- Multiple hierarchies in the same block are supported
- Calculation is triggered on markdown `sigma` code block post processing
- Output is in HTML table format
- File total inserted bottom of output table

## Example

**Input**
```sigma
Monthly Expenses
 Food 1120
 Entertainment 50+50
 Transportation 90+30+30
```
**Output**
```csv
Monthly Expenses,1370
  Food 1120,1120
  Entertainment 50+50,100
  Transportation 90+30+30,150
,1370
```
## Settings
- Output indent (default is 2)

## Futures
- [ ] Number prefix support (e.g. `$1250`)
- [ ] Number support for embedded comma (e.g. `$1,345,123.22`)
- [ ] Stock lookup (e.g. `^AAPL`)
- [ ] Currency identification (e.g. `1250USD`)
- [ ] Currency conversion (e.g. `1250USD->PHP`)
- [ ] Output number format (e.g. `$1,350.23`)
- [ ] Syntax coloring in table output
- [ ] Business functions

## Reference
- Plug-in development [guide](https://marcus.se.net/obsidian-plugin-docs/) (unofficial)
	- [Latest]([https://marcus.se.net/obsidian-plugin-docs/getting-started/plugin-anatomy](https://marcus.se.net/obsidian-plugin-docs/editor)) (paste over to bookmark)
- Github [link](https://github.com/velentir/obsidian-solver/blob/master/README.md).
- [[Obsidian Plugin Development]]

## Implementation 

```mermaid
flowchart LR
all_lines --> line
line --> last_word
last_word --> fix_numbers
fix_numbers --> eval
eval --> add_node
```
- Scan each line in code block
	- Find last word
	- Strip leading `$` followed by a digit
	- Remove `,` if surrounded by digits
	- Eval the expression
	- Add to parent node
- Compute totals for all parents
- Compute totals for block

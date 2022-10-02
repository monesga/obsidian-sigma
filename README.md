# Obsidian Solver

## About
A plugin to enable using obsidian notes as calculation sheets

## Features
- File totals
- Hierarchy and subtotals
- Basic math expressions
- Variables

## Usages
- Financial planning
- Expense tracking
- Miscllaneous calculations

## Guide
- A line that end in a math expression evaluates that expression
- Math expressions cannot contain embedded spaces
- The expression must be the last word on a given line
- And preceeded by spaces
- But results (see below) are allowed to follow the expression
- And recomputed when recalc is performed
- A value of `[]` is added to the end of the line once evaluation is complete
- Hierarchy is supported by using heading tags
- The parent heading is automatically updated with a result `[]` at the end
- Support up to 4 levels of hierarchy
- Multiple hierarchies in the same note are supported
- Recalculation is triggered manually via a plug-in command and can be mapped to a custom key

## Example
### Monthly Expenses [1370]
Food 1120 [1120]
Entertainment  50+50 [100]
Transportation 90+30+30 [150]

## Futures
- Ignoring code blocks
- Stock lookup
- Currency conversion
- Custom theme to syntax color expressions and color results

## Reference
- Plug-in development [guide](https://marcus.se.net/obsidian-plugin-docs/) (unofficial)

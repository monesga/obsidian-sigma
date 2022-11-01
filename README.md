# Obsidian Sigma
[Obsidian](https://obsidian.md) is a great markdown-based note taking app. One of the key aspects of Obsidian is it's extensibility by using additional plugins.

Sigma is a plugin to enable using blocks within a note as calculation sheets.

## Features
- Calculation expressions with proper operator precedence
- Automatic block level totals
- Support for multiple blocks in a single note
- Hierarchy and subtotals
- Variable assignment and evaluation
- Built in scientific functions
- Control over output number formatting
- Output in clean HTML tables for easy sharing
- Syntax coloring for expressions in output
- Supported on desktop and mobile

## Usages
- Financial planning,
- Expense tracking,
- Conversions,
- Miscllaneous calculations,
- And much more

## Guide
- Use a code block (3 backquote characters) with a type sigma
- Write expressions on each line
- Each expression is evaluated
- All expressions in a block are totaled
- Once you exit the block (editing cursor moves out, or switch to read mode), the block is rendered as an HTML table with expression values and block totals

## Exampels

### Simple Calculation List
````
```sigma
12+3+5
13+9+44
2+3*4
2*3+4
2*(3+4)
```
````
Produces
|  |  |  |
| ----| -----| -----|
| `1`	| `12+3+5`	| `20` |
| `2`	| `13+9+44`	| `66`|
|`3`|	`2+3*4`	| `14`|
| `4`|	`2*3+4`	| `10`|
| `5`	|`2*(3+4)`	| `14`|
| | | `124`| 


### Word and Value
You can use a word as a prefix for an expression, separated by a colon character `:`

````
```sigma
test1: 12/3
test2: 98.7
```
````
Produces
|  |  |  |
| ----| -----| -----|
| `1`	|`test1: 12/3`|	`4`|
| `2`	|`test2: 98.7`|	`98.7`|
| | | `102.7` |

### Words and Expressions
You can also use multiple words in a sentence as a prefix, however, you cannot embed numbers or other special characters within the sentence.
````
```sigma
multipe word sentence: 7+9
word1
word2: 2*9
```
````
Produces
|  |  |  |
| ----| -----| -----|
|`1`	|`multipe word sentence: 7+9`	|`16`|
|`2`	|`word1`|	`0`|
|`3`	|`word2: 2*9`|	`18`|
|||`34`|

### Negative Values
````
```sigma
-234
```
````
Produces
|  |  |  |
| ----| -----| -----|
|`1`|	`-234`|	`-234`|

### Hierarchy
Create hierarchies by using space indentation in code blocks. Sigma automatically adds all sub-items to the parent line
````
```sigma
Cat1
 Item1: 5
 Item2: 6
Cat2
 Item3: 7
 Item4: 8
```
````
Produces
|  |  |  |
| ----| -----| -----|
|`1`	|`Cat1`	|`11`|
|`2`	| `....Item1: 5`|	`5`|
|`3`	| `....Item2: 6`|	`6`|
|`4`	|`Cat2` |	`15`|
|`5`	| `....Item3: 7`|	`7`|
|`6`	| `....Item4: 8`|	`8`|
|||`26`|

### Assignment and variable
Variables can be evaluated later within the block
````
```sigma
someVar = 200;
someVar * 10;
```
````
Produces
|  |  |  |
| ----| -----| -----|
|`1`	|`someVar=200;`|	`200` |
|`2`|	`someVar*10;`|	`2,000`|
|||`2,200`|

### Built-in Functions
A number of scientific functions are built-in
````
```sigma
PI=3.141592276
sin(PI/4)
cos(PI/2)
tan(PI/4)
asin(1)
acos(0)
atan(0.7)
abs(2-4)/(2-4)
clamp(29,0,1)
```
````
Produces
|  |  |  |
| ----| -----| -----|
|`1`|	`PI=3.141592276`|	`3.142`|
|`2`|	`sin (PI/4)`|	`0.707` |
|`3`|	`cos (PI/2)`|	`0`|
|`4`|	`tan (PI/4)`|	`1`|
|`5`|	`asin (1)`	|`1.571`|
|`6`|	`acos (0)`	|`1.571`|
|`7`|	`atan (0.7)`|	`0.611`|
|`8`|	`abs (2-4)/(2-4)`|	`-1`|
|`9`|	`clamp (29,0,1)`|	`1`|
|||`8.601`|

### Line References
Even without explicitly naming a variable, each line is automatically referenceable by using `Line` and the line number
````
```sigma
Header1
 Value1: 1
 Value2: 2
Line1+6
```
````
Produces
|  |  |  |
| ----| -----| -----|
|`1`|	`Header1`|	`3`|
|`2`|	`.....Value1: 1`|	`1`|
|`3`|	`.....Value2: 2`|	`2`|
|`4`|	`Line1+6`	|`9`|
|||`12`|

### Complex Expressions
You can use parenthesis for compound expressions as you would expect in a programming language.
````
```sigma
abs(12-3)/(12-3)+9
```
````
Produces
|  |  |  |
| ----| -----| -----|
|`1`|	`abs (12-3)/(12-3)+9`|	`10`|


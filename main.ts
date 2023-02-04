import { match, throws } from 'assert';
import { App, Notice, Plugin, PluginSettingTab, setIcon, Setting } from 'obsidian';
import { __assign } from 'tslib';

////////////////////////////////////////////////// Scanner //////////////////////////////////////////////
enum TokenType { LPar, RPar, Comma, Dot,  Minus, Plus, Star, Slash, Semi, Equal, Ident, Num, Str, Colon, End }
class Token { 
	type: TokenType;
	lexeme: string;
	literal: any;

	constructor(type: TokenType, lexeme: string, literal: any) {
		this.type = type;
		this.lexeme = lexeme;
		this.literal = literal;
	}
}

class Scanner {
	source: string;
	tokens: Token[] = [];
	start: number = 0;
	current: number = 0;
	error: string = "";


	constructor(source: string) {
		this.source = source;
	}

	scanTokens(): Token[] {

		while (!this.isAtEnd()) {
			this.start = this.current;
			this.scanToken();
		}
		this.tokens.push(new Token(TokenType.End, "", null));
		return this.tokens;
	}

	isAtEnd(): boolean {
		return this.current >= this.source.length;
	}

	isDigit(str: string): boolean {
		if (str.length < 1) return false;
		const ch = str[0];
		return ch >= "0" && ch <= "9";
	}

	isAlpha(str: string): boolean {
		if (str.length < 1) return false;
		const ch = str[0];
		return ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch == "_");
	}

	isAlphaNum(str: string) : boolean {
		return this.isAlpha(str) || this.isDigit(str);
	}

	scanToken() {
		let c: string = this.advance();
		switch (c) {
			case "(": this.addToken(TokenType.LPar); break;
			case ")": this.addToken(TokenType.RPar); break;
			case ",": this.addToken(TokenType.Comma); break;
			case ".": this.addToken(TokenType.Dot); break;
			case "+": this.addToken(TokenType.Plus); break;
			case "-": this.addToken(TokenType.Minus); break;
			case "/": this.addToken(TokenType.Slash); break;
			case "*": this.addToken(TokenType.Star); break;
			case ";": this.addToken(TokenType.Semi); break;
			case "=": this.addToken(TokenType.Equal); break;
			case ":": this.addToken(TokenType.Colon); break;
			case " ": 
			case "\t": 
			case "\r": break;
			case "$": break;
			case "'": this.scanString(); break;
			default: 
				if (this.isDigit(c)) {
					this.scanNumber();
				} else if (this.isAlphaNum(c)) {
					this.scanWord();
				}
				else {
					this.error = `unexpected character '${c}'`;
			}
		}
	}

	scanWord() {
		while(this.isAlphaNum(this.peek())) this.advance();
		this.addToken(TokenType.Ident);
	}

	scanNumber() {
		while (this.isDigit(this.peek())) this.advance();
		if (this.peek() == "." && this.isDigit(this.peekNext())) {
			this.advance();
			while(this.isDigit(this.peek())) this.advance();
		}
		this.addTokenX(TokenType.Num, parseFloat(this.source.substring(this.start, this.current)));
	}

	peekNext(): string {
		if (this.current + 1 >= this.source.length) return "\0";
		return this.source.charAt(this.current + 1);
	}

	scanString() {
		while (this.peek() != "'" && !this.isAtEnd()) {
			this.advance();
		}

		if (this.isAtEnd()) {
			this.error = "unterminated string";
			return;
		}
		this.advance();
		const value = this.source.substring(this.start+1, this.current-1);
		this.addTokenX(TokenType.Str, value);
	}

	advance(): string {
		return this.source.charAt(this.current++);
	}

	addToken(type: TokenType) {
		this.addTokenX(type, null);
	}

	addTokenX(type: TokenType, literal: any) {
		const text = this.source.substring(this.start, this.current);
		this.tokens.push(new Token(type, text, literal));
	}

	match(expected: string): boolean {
		if (this.isAtEnd()) return false;
		if (this.source.charAt(this.current) != expected) return false;
		this.current++;
		return true;
	}

	peek(): string {
		if (this.isAtEnd()) return "\0";
		return this.source.charAt(this.current);
	}

	shouldSpace(index: any): boolean {
		const next = parseInt(index) + 1;
		if (next >= this.tokens.length) return false;
		const t = this.tokens[next];
		return t.type == TokenType.Num || t.type == TokenType.Ident || t.type == TokenType.LPar || t.type == TokenType.Minus;
	}

	render(el: any) {
		const pre = el.createEl("span");

		for (const i in this.tokens) {			
			const t = this.tokens[i];

			if (this.error.length > 0) {
				el.createEl("div", { text: this.error, cls: "scan_error"});
			}

			if (t.type == TokenType.Colon) {
				el.createEl("span", { text: ": ", cls: "punctuator"});
			} else if (t.type == TokenType.Ident) {
				el.createEl("span", { text: t.lexeme, cls: "identifier"});
				if (this.shouldSpace(i)) el.createEl("span", { text: " " });
			} else if (t.type == TokenType.Num) {
				el.createEl("span", { text: t.lexeme, cls: "number"});
			} else if (t.type == TokenType.Str) {
				el.createEl("span", { text: t.lexeme, cls: "string"});
			} else {
				el.createEl("span", { text: t.lexeme, cls: "punctuator"});
			}
		}
	}
}

////////////////////////////////////////////////// Parser //////////////////////////////////////////////
class ParseNode {
	token: number;
	left: ParseNode|null;
	right: ParseNode|null;
	constructor(token: number, left: ParseNode|null, right: ParseNode|null) {
		this.token = token;
		this.left = left;
		this.right = right;
	}
}

class Parser {	
	scanner: Scanner;
	current: number = 0;

	constructor(source: string) {
		this.scanner = new Scanner(source);
		this.scanner.scanTokens();
	}

	match(start: number, ...types: TokenType[]): ParseNode | null {
		this.current = start;
		for (const t in types) {
			if (this.scanner.tokens[start].type == types[t]) {			
				this.current++;
				return new ParseNode(start, null, null);
			}			
		}
		this.current = start;
		return null;
	}

	primary(start: number): ParseNode | null {
		this.current = start;

		let call = this.call(start);
		if (call) return call;

		let ident = this.match(start, TokenType.Ident); 
		if (ident) {
			const temp = this.current;
			const eq = this.match(this.current, TokenType.Equal, TokenType.Colon);
			if (eq) {
				eq.left = ident;
				eq.right = this.expression(this.current);
				return eq;
			}
			// <identifier1> <identifier2> = skip <identifier1>
			const nextId = this.match(this.current, TokenType.Ident);
			if (nextId) {
				return this.primary(temp);
			} 
			this.current = start;
		}
		let node = this.match(start, TokenType.Num, TokenType.Str, TokenType.Ident);
		if (node) return node;
		
		if (this.match(this.current, TokenType.LPar)) {
			node = this.expression(this.current);			
			if (this.match(this.current, TokenType.RPar)) {
				return node;
			}
			// syntax error
			return null;
		}
		this.current = start;
		return null;
	}

	arguments(start: number): ParseNode | null {
		const node = this.expression(start);
		if (!node) return null;
		const comma = this.match(this.current, TokenType.Comma);
		if (comma) {
			comma.left = node;
			comma.right = this.arguments(this.current);
			return comma;
		}
		return node;
	}

	unary(start: number): ParseNode | null {
		const node = this.match(start, TokenType.Minus);
		if (node) {
			const expr = this.unary(this.current);
			if (expr) {
				node.left = expr;
				return node;
			}
		}		
		return this.primary(start);
	}


	term_factor(start: number, method: any, type1: any, type2: any): ParseNode | null {
		this.current = start;
		let left = method.apply(this, [start, type1, type2]);
		let op: ParseNode|null = null;

		if (!left) {
			this.current = start;
			return op;
		}

		op = this.match(this.current, type1, type2);
		if (!op) {
			return left;
		}

		while (op) {
			const un = method.apply(this, [this.current, type1, type2]);
			if (!un) {
				this.current = start;
				return null;
			}			
			op.left = left;
			op.right = un;
			left = op;
			op = this.match(this.current, type1, type2);
		}
		return left;
	}

	factor(start: number): ParseNode | null {
		return this.term_factor(start, this.unary, TokenType.Star, TokenType.Slash);
	}

	term(start: number): ParseNode | null {
		return this.term_factor(start, this.factor, TokenType.Plus, TokenType.Minus);
	}	

	call(start: number): ParseNode | null {
		this.current = start;
		const id = this.match(start, TokenType.Ident);
		if (id) {
			const lpar = this.match(this.current, TokenType.LPar);
			if (lpar) {
				lpar.left = id;
				lpar.right = this.arguments(this.current);
				this.match(this.current, TokenType.RPar);
				return lpar;
			}
		}
		this.current = start;
		return null;
	}

	statement(start: number): ParseNode | null {
		return this.term(this.current);
	}

	expression(start: number): ParseNode | null {
		return this.statement(start);
	}	
}

/////////////////////////////////////////////// Interpreter ////////////////////////////////////////////
interface CalcHost {
	setVar(id: string, value: number): any;
	getVar(id: string): any;
	format(value: number): string;
}

class Calc {
	parser: Parser;
	host: CalcHost;

	constructor(source: string, host: CalcHost) {
		this.parser = new Parser(source);
		this.host = host;
	}

	getToken(index: number): Token {
		return this.parser.scanner.tokens[index];
	}

	assign(node: ParseNode): number {
		if (!node.left) return 0;
		const result = this.run(node.right);
		const token =  this.getToken(node.left.token);
		this.host.setVar(token.lexeme, result);
		return result;
	}

	clamp(node: ParseNode) {
		let value = 0;
		let min = 0;
		let max = 0;
		if (node) {
			if (node.right) {
				value = this.run(node.right.left);
				if (node.right.right) {
					min = this.run(node.right.right.left);
					if (node.right.right.right) {
						max = this.run(node.right.right.right);
					}
				}
			}
		} 
		return Math.min(Math.max(value, min), max);
	}

	call(node: ParseNode) {
		if (!node.left) return 0;
		const fname = this.parser.scanner.tokens[node.left.token].lexeme;
		switch (fname) {
			case "sin": return Math.sin(this.run(node.right));
			case "cos": return Math.cos(this.run(node.right));
			case "tan": return Math.tan(this.run(node.right));
			case "asin": return Math.asin(this.run(node.right));
			case "acos": return Math.acos(this.run(node.right));
			case "atan": return Math.atan(this.run(node.right));
			case "abs": return Math.abs(this.run(node.right));
			case "clamp": return this.clamp(node);
		}
	}

	run(node: ParseNode | null): any {
		if (!node) return null;
		let token = this.parser.scanner.tokens[node.token];
		switch (token.type) {
			case TokenType.Num: return token.literal;
			case TokenType.Str: return token.literal;
			case TokenType.Plus: return this.run(node.left) + this.run(node.right);
			case TokenType.Minus: 
				if (!node.right) return - this.run(node.left);
				return this.run(node.left) - this.run(node.right);
			case TokenType.Star: return this.run(node.left) * this.run(node.right);
			case TokenType.Slash: return this.run(node.left) / this.run(node.right);
			case TokenType.Equal: return this.assign(node);
			case TokenType.Colon: return this.run(node.right);
			case TokenType.Ident: return this.host.getVar(this.getToken(node.token).lexeme);
			case TokenType.LPar: return this.call(node);
			default: return null;
		}
	}

	exec(): any {
		return this.run(this.parser.expression(0));
	}

}

class Line {
	host: CalcHost;
	children: Line[];
	parent: Line | null;
	source: string;
	expression: string;
	result: number;
	indent: number;	
	has$: boolean;
	calc: Calc;
	row: number;

	updatLineVar() {
		const name = `Line${this.row}`;
		this.host.setVar(name, this.result);
	}

	update(plus: number)  {
			this.result += plus;
			this.updatLineVar();	
	}
	
	resultString(): string {
		if (!this.result) return "0";		
		return `${this.has$ ? "$" : ""}${this.host.format(this.result)}`;		
	}

	selfRender(row: any) {
		
		if (this.host.settings.rowIndex) {
			const line = row.createEl("td");
			line.createEl("span", { text: (this.row > 0) ? this.row.toString() : "" , cls: "line_number"});
		}
		
		const source = row.createEl("td");
		if (this.calc?.parser?.scanner) {
			const pad = " ".repeat(this.indent*4);
			source.createEl("span", { text: pad, cls: "line_number"});
			this.calc.parser.scanner.render(source);
		}
		
		const result = row.createEl("td");
		result.createEl("span", { text: this.resultString(), cls: "result" } );
	}

	render(body: any): void {
		if (this.parent) {
			const row = body.createEl("tr");
			this.selfRender(row);
			this.children.map(n => n.render(body));	
		} else {
			this.children.map(n => n.render(body));	
			const row = body.createEl("tr");
			this.selfRender(row);
		}
	}

	constructor(source: string, row: number, host: CalcHost) {
		this.host = host;
		this.source = source;
		this.indent = 0;
		this.children = new Array<Line>;
		this.parent = null;
		this.result = 0;
		this.has$ = false;
		this.row = row;

		if (source === "") {
			this.indent = -1;
			this.source = "Total";
			return;
		}

		// compute leading indent
		for(let i = 0; i < source.length; i++) {
			if (source.charAt(i) == ' ') 
				this.indent = this.indent + 1;
			else 
				break;
		}

		this.calc = new Calc(source, host);	
		this.result = this.calc.exec();
		this.updatLineVar();
		return;		
	}
}


interface SigmaPluginSettings {
	format: boolean;
	rowIndex: boolean;
}

const DEFAULT_SETTINGS: SigmaPluginSettings = {
	format: true,
	rowIndex: true
}


export default class SigmaPlugin extends Plugin implements CalcHost {
	variables = new Map<string, any>();

	setVar(id: string, value: number) {
		this.variables.set(id, value)	;
	}

	getVar(id: string) {
		if (!this.variables.has(id)) return 0;
		return this.variables.get(id);
	}

	format(value: number): string {
		const str =  value.toLocaleString();
		if (this.settings.format) return str;
		return str.replace(/,/g, "");
	}

	settings: SigmaPluginSettings;

	process(source: string): Line {
		this.variables.clear();
		let root = new Line("", 0, this);
			let currentNode = root;
			const lines = source.split("\n").filter((row) => row.length > 0);
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const node = new Line(line, i+1, this);
				if (node.indent <= currentNode.indent) {
					// find closest parent with indent < node.indent
					let par: Line | null = null;
					for (par = currentNode.parent; par?.indent >= node.indent; par = par?.parent);
					node.parent = par;
				} else {
					node.parent = currentNode;
				}
				node.parent.children.push(node);
				for(let par = node.parent; par; par = par.parent) {
					par.update(node.result);
				}
				
				if (node.parent)
					node.parent.has$ = node.has$;
				currentNode = node;
			}

			return root;
	}

	async onload() {
		await this.loadSettings();
		this.registerMarkdownCodeBlockProcessor("sigma", (source, el, ctx) => {
			const root = this.process(source);

			const table = el.createEl("table");
			const body = table.createEl("tbody");
			if (root.children.length === 1)
				root.children[0].render(body);
			else 
				root.render(body);
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SigmaSettingsTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SigmaSettingsTab extends PluginSettingTab {
	plugin: SigmaPlugin;

	constructor(app: App, plugin: SigmaPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Sigma Settings'});

		new Setting(containerEl)
			.setName('Format result')
			.setDesc('Show comma separators for results')
			.addToggle(toggle => {
				toggle
				.setValue(this.plugin.settings.format)
				.onChange(async (value) => {
					this.plugin.settings.format = value;
					await this.plugin.saveSettings();
				})
			})

		new Setting(containerEl)
			.setName('Row Index Column')
			.setDesc('First Column shows the row number')
			.addToggle(toggle => {
				toggle
				.setValue(this.plugin.settings.rowIndex)
				.onChange(async (value) => {
					this.plugin.settings.rowIndex = value;
					await this.plugin.saveSettings();
				})
			})

	}
}

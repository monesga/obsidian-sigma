import { match } from 'assert';
import { App, Notice, Plugin, PluginSettingTab, setIcon, Setting } from 'obsidian';



////////////////////////////////////////////////// Scanner //////////////////////////////////////////////
enum TokenType { LPar, RPar, Comma, Dot,  Minus, Plus, Star, Slash, Semi, Equal, Ident, Num, Str, End }
const TokenTypeNames = [ "LPar", "RPar", "Comma", "Dot",  "Minus", "Plus", "Star", "Slash", "Semi", "Equal", "Ident", "Num", "Str", "End" ];
class Token { 
	type: TokenType;
	lexeme: string;
	literal: any;
	line: number;

	constructor(type: TokenType, lexeme: string, literal: any, line: number) {
		this.type = type;
		this.lexeme = lexeme;
		this.literal = literal;
		this.line = line;
	}

	toString(): string {
		return `${this.line} [${TokenTypeNames[this.type]}] ${this.lexeme} ${this.literal}`;
	}
}

// TODO: Indent/Detent tokens
// TODO: fix empty lines not showing
class Scanner {
	source: string;
	tokens: Token[] = [];
	start: number = 0;
	current: number = 0;
	line: number = 1;
	errors = new Map<number, string>();

	constructor(source: string) {
		this.source = source;
	}

	scanTokens(): Token[] {
		while (!this.isAtEnd()) {
			this.start = this.current;
			this.scanToken();
		}
		this.tokens.push(new Token(TokenType.End, "", null, this.line));
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
			case " ": 
			case "\t": 
			case "\r": break;
			case "\n":  this.line++; break;
			case "'": this.scanString(); break;
			default: 
				if (this.isDigit(c) || c == "$") {
					this.scanNumber();
				} else if (this.isAlphaNum(c)) {
					this.scanWord();
				}
				else {
					this.errors.set(this.line, `unexpected character '${c}'`);
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
			if (this.peek() == "\n") this.line++;
			this.advance();
		}

		if (this.isAtEnd()) {
			this.errors.set(this.line, "unterminated string");
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
		this.tokens.push(new Token(type, text, literal, this.line));
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

	pad(str: string, width: number): string {
		let delta = width - str.length;
		if (delta <= 0) return str;
		let ret = str;
		while (delta >= 0) {
			ret = " " + ret;
			delta--;
		}
		return ret + " ";
	}

	render(el: any) {
		const pre = el.createEl("pre");
		let line = 0;
		for (const i in this.tokens) {			
			const t = this.tokens[i];

			if (t.line != line && this.errors.has(t.line)) {
				el.createEl("div", { text: this.errors.get(t.line), cls: "scan_error"});
			}

			while (t.line > line) {
				el.createEl("div", { text: "\n" });
				el.createEl("span", { text: `${this.pad((line+1).toString(),3)}`, cls: "line_number"});
				line++;
			}

			if (t.type == TokenType.Ident) {
				el.createEl("span", { text: t.lexeme, cls: "identifier"});
			} else if (t.type == TokenType.Num) {
				el.createEl("span", { text: t.lexeme, cls: "number"});
			} else if (t.type == TokenType.Str) {
				el.createEl("span", { text: t.lexeme, cls: "string"});
			} else {
				el.createEl("span", { text: t.lexeme, cls: "punctuator"});
			}
			el.createEl("span", { text: " " });
		}
	}
}

////////////////////////////////////////////////// Parser //////////////////////////////////////////////


/////////////////////////////////////////////// Interpreter ////////////////////////////////////////////

class Line {
	children: Line[];
	parent: Line | null;
	source: string;
	expression: string;
	result: number;
	indent: number;	
	has$: boolean;

	update() : number {
		this.result = this.children.reduce((prev, node) => prev + node.update(), this.result);
		return this.result;
	}

	resultString(): string {
		return `${this.has$ ? "$" : ""}${this.result.toLocaleString().toString()}`;
		
	}

	selfRender(row: any) {
		row.createEl("td", { text: this.source } );
		row.createEl("td", { text: this.resultString() } );
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

	constructor(source: string) {
		this.source = source;
		this.indent = 0;
		this.children = new Array<Line>;
		this.parent = null;
		this.result = 0;
		this.has$ = false;

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

		// split to words
		const words = source.split(' ');

		// only one word, we're done
		if (words.length <= 0) return;

		// find last word
		const last = words[words.length-1];
		let expr = "";

		// strip "$"
		for (let i = 0; i < last.length; i++) {
			const ch = last.charAt(i);
			if (ch === "$") this.has$ = true;
			if (ch !== "$" && ch !== "_") {
					expr = expr + ch;
				}
		}

		this.expression = expr;
		if (this.expression.length > 0 ) {
			try {
				this.result = eval(this.expression);
			} catch {
				this.result = 0;
			}
			
		}
	}
}


interface SigmaPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: SigmaPluginSettings = {
	mySetting: 'default'
}


export default class SigmaPlugin extends Plugin {
	settings: SigmaPluginSettings;

	process(source: string, root: any) {
		const scanner = new Scanner(source);
		scanner.scanTokens();
		scanner.render(root);
		return;
		const pre = root.createEl("pre");
		if (scanner.errors.length > 0) {
			for (const e in scanner.errors) {
				const text = scanner.errors[e];
				pre.createEl("div", { text: text});
			}
		} else {
			for (const t in scanner.tokens) {
				const text = scanner.tokens[t].toString(); 
				pre.createEl("div", { text: text});
			}
		}
	}

	async onload() {
		await this.loadSettings();
		this.registerMarkdownCodeBlockProcessor("sigma", (source, el, ctx) => {
			this.process(source, el);
			return;
			const table = el.createEl("table");
			const body = table.createEl("tbody");

			let root = new Line("");
			let currentNode = root;
			const lines = source.split("\n").filter((row) => row.length > 0);
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const node = new Line(line);
				if (node.indent <= currentNode.indent) {
					// find closest parent with indent < node.indent
					let par: Line | null = null;
					for (par = currentNode.parent; par?.indent >= node.indent; par = par?.parent);
					node.parent = par;
				} else {
					node.parent = currentNode;
				}
				node.parent.children.push(node);
				if (node.parent)
					node.parent.has$ = node.has$;
				currentNode = node;
			}

			root.update();
			if (root.children.length === 1)
				root.children[0].render(body);
			else 
				root.render(body);
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		setIcon(statusBarItemEl, 'lines-of-text');
		// statusBarItemEl.setText('Σ');

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

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

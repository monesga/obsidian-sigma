import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

const zero = "0".charCodeAt(0);
const nine = "9".charCodeAt(0);
const next = (str: String, idx: number): String => {
	if (idx >= str.length - 1) return "";
	return str[idx + 1];
}

class Node {
	children: Node[];
	parent: Node | null;
	source: string;
	expression: string;
	result: number;
	indent: number;	

	render(body) {
		if (this.parent) {
			const row = body.createEl("tr");
			row.createEl("td", { text: this.source } );
			row.createEl("td", { text: this.result.toLocaleString().toString() } );
			this.children.map(n => n.render(body));	
		} else {
			this.children.map(n => n.render(body));	
			const row = body.createEl("tr");
			row.createEl("td", { text: this.source } );
			row.createEl("td", { text: this.result.toLocaleString().toString() } );
		}
	}

	constructor(source: string) {
		this.source = source;
		this.indent = 0;
		this.children = new Array<Node>;
		this.parent = null;
		this.result = 0;

		if (source === "") {
			this.indent = -1;
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
		if (words.length <= 1) return;

		// find last word
		const last = words[words.length-1];
		let expr = "";

		// strip "$"
		for (let i = 0; i < last.length; i++) {
			const ch = last.charAt(i);
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

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		this.registerMarkdownCodeBlockProcessor("sigma", (source, el, ctx) => {
			const table = el.createEl("table");
			const body = table.createEl("tbody");

			let root = new Node("");
			let currentNode = root;
			const rows = source.split("\n").filter((row) => row.length > 0);
			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				const node = new Node(row);
				if (node.indent <= currentNode.indent) {
					node.parent = currentNode.parent;
				} else {
					node.parent = currentNode;
				}
				node.parent.children.push(node);
				if (node.parent)
					node.parent.result = node.parent.result + node.result;
				currentNode = node;
			}
		
			root.render(body);

		});


		this.registerMarkdownCodeBlockProcessor("csv", (source, el, ctx) => {
			const rows = source.split("\n").filter((row) => row.length > 0);
	  
			const table = el.createEl("table");
			const body = table.createEl("tbody");
	  
			for (let i = 0; i < rows.length; i++) {
			  const cols = rows[i].split(",");
	  
			  const row = body.createEl("tr");
	  
			  for (let j = 0; j < cols.length; j++) {
				row.createEl("td", { text: cols[j] } );
			  }
			}
		  });

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('plus-minus-glyph', 'Sigma', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a Sigma!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Sigma Active');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
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

const workspace = document.querySelector(".pole-raboti");
const blocks = document.querySelectorAll(".container-button");
const runButton = document.getElementById("runButton");
const terminalOutput = document.querySelector(".terminal-output");


let workspaceBlocks = [];
let draggedBlock = null;

// вложенные зоны drop (IF/ELSE)
function enableInnerDrop(container) {
	if (!container) return;

	container.addEventListener("dragover", (e) => {
		e.preventDefault();
		e.stopPropagation();
	});

	container.addEventListener("drop", (e) => {
		e.preventDefault();
		e.stopPropagation();

		const mode = e.dataTransfer.getData("mode");

		if (mode === "copy") {
			const type = e.dataTransfer.getData("type");
			if (!type) return;
			const newBlock = createWorkspaceBlock(type);
			container.appendChild(newBlock);
			rebuildWorkspaceBlocks();
			return;
		}

		if (mode === "move") {
			if (!draggedBlock) return;
			container.appendChild(draggedBlock);
			draggedBlock = null;
			rebuildWorkspaceBlocks();
			return;
		}
	});
}

// копируем в рабочую область
blocks.forEach((btn) => {
	btn.addEventListener("dragstart", (e) => {
		e.dataTransfer.setData("mode", "copy");
		e.dataTransfer.setData("type", btn.dataset.type);
	});
});

// разрешаем drop везде, даже на блоках
workspace.addEventListener("dragover", (e) => {
	e.preventDefault();
});

// ловим drop даже если отпустили над блоком/инпутом
workspace.addEventListener("drop", (e) => {
	e.preventDefault();
	// если бросили внутрь вложенной зоны (IF/ELSE/WHILE), то пусть обработает она
	if (e.target && e.target.closest && e.target.closest(".droppable")) return;

	const mode = e.dataTransfer.getData("mode");

	if (mode === "copy") {
		const type = e.dataTransfer.getData("type");
		if (!type) return;

		const newBlock = createWorkspaceBlock(type);

		insertBlockByMouseY(newBlock, e.clientY);

		rebuildWorkspaceBlocks();
		console.log(workspaceBlocks);
		return;
	}

	if (mode === "move") {
		if (!draggedBlock) return;

		insertBlockByMouseY(draggedBlock, e.clientY);

		draggedBlock = null;

		rebuildWorkspaceBlocks();
		console.log(workspaceBlocks);
		return;
	}
});

// Вставка блока по позиции мыши
function insertBlockByMouseY(blockElement, mouseY) {
	const allBlocks = workspace.querySelectorAll(".workspace-block");

	for (let i = 0; i < allBlocks.length; i++) {
		const b = allBlocks[i];

		// если тащим этот же блок — пропускаем
		if (b === blockElement) continue;

		const box = b.getBoundingClientRect();
		const middle = box.top + box.height / 2;

		if (mouseY < middle) {
			workspace.insertBefore(blockElement, b);
			return;
		}
	}

	workspace.appendChild(blockElement);
}

//  Создаём блок внутри workspace 
function createWorkspaceBlock(type) {
	const newBlock = document.createElement("div");
	newBlock.classList.add("workspace-block");

	// делаем его перетаскиваемым 
	newBlock.draggable = true;

	// data-type чтобы потом пересобирать массив
	newBlock.dataset.type = type;

	// кнопка удаления
	const deleteBtn = document.createElement("button");
	deleteBtn.textContent = "🗑";
	deleteBtn.classList.add("delete-btn");


	if (type === "new_value") {
		newBlock.innerHTML = `let <input type = "text" class="block-input" placeholder="название переменной">`;
	}
	else if (type === "assign") {
		newBlock.innerHTML = `<input type = "text" class="block-input" placeholder="переменная"> = <input type = "text" class="block-input" placeholder="значение">`;
	}
	else if (type === "IF") {
		newBlock.innerHTML = `
			<div class="if-header">
				IF <input type = "text" class="block-input" placeholder="условие (пример: x > 0)">
			</div>
			<div class="if-body droppable"></div>
			<div class="else-header">ELSE</div>
			<div class="else-body droppable"></div>
		`;

		enableInnerDrop(newBlock.querySelector(".if-body"));
		enableInnerDrop(newBlock.querySelector(".else-body"));
	}

	newBlock.appendChild(deleteBtn);

	// перемещение блока внутри workspace 
	newBlock.addEventListener("dragstart", (e) => {
		draggedBlock = newBlock;
		e.dataTransfer.setData("mode", "move");
	});

	// удаление блока
	deleteBtn.addEventListener("click", () => {
		newBlock.remove();
		rebuildWorkspaceBlocks();
		console.log(workspaceBlocks);
	});

	workspace.appendChild(newBlock);

	// Сохраняем ввод
	const inputs = newBlock.querySelectorAll("input");

	if (type === "new_value") {
		inputs[0].addEventListener("input", () => {
			newBlock.dataset.variables = inputs[0].value;
		});
	}
	else if (type === "assign") {
		inputs[0].addEventListener("input", () => {
			newBlock.dataset.variable = inputs[0].value;
		});
		inputs[1].addEventListener("input", () => {
			newBlock.dataset.value = inputs[1].value;
		});
	}
	else if (type === "IF") {
		inputs[0].addEventListener("input", () => {
			newBlock.dataset.condition = inputs[0].value;
		});
	}

	return newBlock;
}

// Пересобираем массив из DOM (поддерживает вложенные блоки в IF/ELSE)
function readBlock(b) {
	const obj = {
		type: b.dataset.type,
		data: {}
	};

	if (b.dataset.type === "new_value") {
		obj.data.variables = b.dataset.variables || "";
	}
	else if (b.dataset.type === "assign") {
		obj.data.variable = b.dataset.variable || "";
		obj.data.value = b.dataset.value || "";
	}
	else if (b.dataset.type === "IF") {
		obj.data.condition = b.dataset.condition || "";
		const ifBody = b.querySelector(".if-body");
		const elseBody = b.querySelector(".else-body");
		const ifBlocks = ifBody ? ifBody.querySelectorAll(":scope > .workspace-block") : [];
		const elseBlocks = elseBody ? elseBody.querySelectorAll(":scope > .workspace-block") : [];
		obj.then = Array.from(ifBlocks).map(readBlock);
		obj.else = Array.from(elseBlocks).map(readBlock);
	}

	return obj;
}

function rebuildWorkspaceBlocks() {
	const topBlocks = workspace.querySelectorAll(":scope > .workspace-block");
	workspaceBlocks = Array.from(topBlocks).map(readBlock);
}


runButton.addEventListener("click", () => {

	rebuildWorkspaceBlocks();

	// очищаем терминал перед выводом
	terminalOutput.innerHTML = "";

	const vm = new Interpreter((s) => {
		const line = document.createElement("div");
		line.textContent = String(s);
		terminalOutput.appendChild(line);
	});

	try {
		vm.run(workspaceBlocks);
		vm.dump();
	} catch (e) {
		const line = document.createElement("div");
		line.textContent = "Ошибка: " + e.message;
		terminalOutput.appendChild(line);
	}

});

class Interpreter  {
	constructor (printFn) {
		this.variables = new Map();
		this.print = printFn || ((s) => console.log(s));
	}

	run(program) {
		for (const block of program) {
			this.exec(block);
		}
	}

	exec(block) {
		switch (block.type) {
			case "new_value":
				this.declare(block.data.variables);
				break;
			case "assign":
				this.assign(block.data.variable, block.data.value);
				break;
			case "IF":
				this.execIf(block);
				break;
			default:
				throw new Error("Неизвестный блок: " + block.type);
		}
	}

	declare(csv) {
		const names = String(csv)
			.split(",")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		for (const name of names) {
			if (!/^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё_0-9]*$/.test(name)) {
				throw new Error("Некорректное имя переменной: " + name);
			}
			if (!this.variables.has(name)) {
				this.variables.set(name, 0);
			}
		}
	}

	assign(name, expr) {
		name = String(name).trim();
		if (!this.variables.has(name)) {
			throw new Error("Переменная не объявлена: " + name);
		}
		const value = RNP.calculate(String(expr), (varName) => {
			if (!this.variables.has(varName)) return undefined;
			return this.variables.get(varName);
		});
		this.variables.set(name, value);
	}

	execIf(block) {
		const cond = String(block.data.condition || "").trim();
		if (cond.length === 0) throw new Error("Пустое условие IF");
		const ok = this.evalCondition(cond);
		if (ok) {
			if (block.then) this.run(block.then);
		} else {
			if (block.else) this.run(block.else);
		}
	}

	evalCondition(cond) {
		const m = cond.match(/^\s*(.+?)\s*(>=|<=|!=|=|>|<)\s*(.+?)\s*$/);
		if (!m) throw new Error("Некорректное условие: " + cond);
		const left = RNP.calculate(m[1], (n) => {
			if (!this.variables.has(n)) return undefined;
			return this.variables.get(n);
		});
		const right = RNP.calculate(m[3], (n) => {
			if (!this.variables.has(n)) return undefined;
			return this.variables.get(n);
		});
		const op = m[2];
		switch (op) {
			case ">": return left > right;
			case "<": return left < right;
			case "=": return left === right;
			case "!=": return left !== right;
			case ">=": return left >= right;
			case "<=": return left <= right;
		}
		return false;
	}

	dump() {
		this.print("\nПеременные:");
		for (const [k, v] of this.variables.entries()) {
			this.print(k + " = " + v);
		}
	}
}

class RNP {
	static ops_priority = {
		'+' : 2,
		'-' : 2,
		'%' : 3,
		'*' : 3,
		'/' : 3,
		'u-': 4,
		'^' : 5,
	}

	static calculate (expression, resolver) {
		let tokens = this.shunting_yard(this.tokenize(expression));
		let stack = [];
		for (const token of tokens) {
			if (!this.isOperator(token)) {
				if (/^-?\d+$/.test(token)) {
					stack.push(parseInt(token));
				}
				else {
					if (!resolver) throw new Error("Неизвестный токен: " + token);
					const v = resolver(token);
					if (v === undefined) throw new Error("Переменная не объявлена: " + token);
					stack.push(parseInt(v));
				}
			}
			else {
				const a = stack.pop();
				const b = (token === 'u-') ? 0 : stack.pop();
				switch (token) {
					case '+':
						stack.push(a + b);
						break;
					case '-':
						stack.push(b - a);
						break;
					case '*':
						stack.push(b * a);
						break;
					case '/':
						stack.push(parseInt(b / a));
						break;
					case '^':
						stack.push(b ** a);
						break;
					case '%':
						stack.push(b % a);
						break;
					case 'u-':
						stack.push(-a);
						break;
				}
			}
		}

		return stack.pop();
	}

	static shunting_yard (tokens) {
		let queue = [];
		let stack = [];

		for (let i = 0; i < tokens.length; ++i) {
			let token = tokens[i];
			if (token === '-' && (i == 0 || (this.isOperator(tokens[i - 1]) || tokens[i -  1] === '('))) {
				token = 'u-';
			}
			if (!(this.isOperator(token) || token === ')' || token === '(')) {
				queue.push(token);
			}
			else if (token === '(') {
				stack.push(token);
			}
			else if (token === ')') {
				while (stack.length != 0 && stack.at(-1) != '(') {
					queue.push(stack.pop());
				}

				if (stack.length === 0) {
					console.log('error');
					return;
				}
				stack.pop();
			}
			else {
				while (stack.length != 0 && stack.at(-1) !== '('
				&& (this.ops_priority[stack.at(-1)] > this.ops_priority[token]
					|| (this.ops_priority[stack.at(-1)] === this.ops_priority[token]
						&& this.isLeftAssociative(token)))) {
					queue.push(stack.pop());
				}

				stack.push(token);
			}
		}
		while (stack.length !== 0) {
			if (stack.at(-1) === '(') {
				console.log('error');
				return;
			}
			queue.push(stack.pop());
		}

		return queue;
	}

	static tokenize(exp) {
		let tokens = [];

		let buffer = '';
		let buffer_type = '';

		for (const char of exp) {
			if (char === ' ') continue;
			if (buffer.length === 0) {
				if (this.isDigit(char)) {
					buffer_type = 'number';
				}
				else if (this.isLetter(char)) {
					buffer_type = 'variable';
				}
			}
			if (this.isDigit(char)) {
				buffer += char;
			}
			else if (this.isVariableSymbol(char)) {
				if (buffer_type == 'number') {
					console.log('error');
					return;
				}
				buffer += char;
			}
			else if (this.isOperator(char) || char == '(' || char == ')') {
				if (buffer !== '') {
					tokens.push(buffer);
					buffer = '';
				}
				tokens.push(char);
			}
			else {
				console.log('error');
				return;
			}
		}
		if (buffer !== '') {
			tokens.push(buffer);
			buffer = '';
		}

		return tokens;
	}

	static isLeftAssociative(token) {
		return token !== '^' && token !== 'u-';
	}

	static isLetter(char) {
		return /^[A-Za-zА-Яа-яЁё]$/.test(char);
	}

	static isVariableSymbol(char) {
		return /^[A-Za-zА-Яа-яЁё_0-9]$/.test(char);
	}

	static isOperator(char) {
		return ['+', '-', '*', '/', '%', '^', 'u-'].includes(char);
	}

	static isDigit(char) {
		return /^[0-9]$/.test(char);
	}
}

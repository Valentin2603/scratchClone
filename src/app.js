const workspace = document.querySelector(".pole-raboti");
const blocks = document.querySelectorAll(".container-button");
const runButton = document.getElementById("runButton");
const terminalOutput = document.querySelector(".terminal-output");


let workspaceBlocks = [];
let draggedBlock = null;

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
		newBlock.innerHTML = `let <input class="block-input" placeholder="название переменной">`;
	}
	else if (type === "assign") {
		newBlock.innerHTML = `<input class="block-input" placeholder="переменная"> = <input class="block-input" placeholder="значение">`;
	}
	else if (type === "IF") {
		newBlock.innerHTML = `IF <input class="block-input" placeholder="условие">`;
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

// Пересобираем массив в DOMe
function rebuildWorkspaceBlocks() {
	workspaceBlocks = [];

	const allBlocks = workspace.querySelectorAll(".workspace-block");

	allBlocks.forEach((b) => {
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
		else if (type === "IF") {
			newBlock.innerHTML = `
				<div class="if-header">
					IF <input class="block-input" placeholder="условие">
				</div>
				<div class="if-body"></div>
				<div class="else-header">ELSE</div>
				<div class="else-body"></div>
			`;

			const conditionInput = newBlock.querySelector(".block-input");

			conditionInput.addEventListener("input", () => {
				newBlock.dataset.condition = conditionInput.value;
			});

			const ifBody = newBlock.querySelector(".if-body");
			const elseBody = newBlock.querySelector(".else-body");

			enableInnerDrop(ifBody);
			enableInnerDrop(elseBody);
		}

		workspaceBlocks.push(obj);
	});
}


runButton.addEventListener("click", () => {

	rebuildWorkspaceBlocks();

	// очищаем терминал перед выводом
	terminalOutput.innerHTML = "";

	// выводим красиво
	workspaceBlocks.forEach((block, index) => {

		const line = document.createElement("div");

		if (block.type === "new_value") {
			line.textContent = `Объявить: ${block.data.variables}`;
		}
		else if (block.type === "assign") {
			line.textContent = `${block.data.variable} = ${block.data.value}`;
		}
		else if (block.type === "IF") {
			line.textContent = `IF (${block.data.condition})`;

			// вывод вложенных блоков
			block.children.forEach((child) => {
				const childLine = document.createElement("div");
				childLine.style.marginLeft = "20px";
				childLine.textContent = `→ ${child.type}`;
				terminalOutput.appendChild(childLine);
			});
		}

		terminalOutput.appendChild(line);
	});

});

class Interpreter  {
	constructor () {
		this.bloks = document.querySelector("pole-raboti").querySelectorAll("workspace-block");
		this.variables = new Map();

	}

	runAlgorithm () {
		for (block of blocks) {
			input = block.querySelector("input");
			select = block.querySelector("select");

			switch (block.type) {
				case "assign":
					this.assignment(select.value, input.value);
			}
		}
	}

	assigment(name, exp) {
		if (!this.variables.has(name)) {
			console.log('no such variable');
		}

		this.variables.set(name, RNP.calculate(exp));
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

	static calculate (expression) {
		let tokens = this.shunting_yard(this.tokenize(expression));
		let stack = [];
		for (const token of tokens) {
			if (!this.isOperator(token)) {
				stack.push(parseInt(token));
			}
			else {
				const a = stack.pop();
				const b = stack.pop();
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
			if (token == '-' && (i == 0 || (this.isOperator(tokens[i - 1]) || tokens[i -  1] === '('))) {
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
				while (stack.length != 0 && stack.at(-1) != '('
					&& (this.ops_priority[stack.at(-1)] > this.ops_priority[token]
					|| (this.ops_priority[stack.at(-1)] === this.ops_priority[token] 
					&& this.isLeftAssociative(token)))) {
					queue.push(stack.pop());
				}

				stack.push(token);
			}
		}
		while (stack.length != 0) {
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
				if (buffer != '') {
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
		if (buffer != '') {
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
		return ['+', '-', '*', '/', '%', '^'].includes(char);
	}

	static isDigit(char) {
		return /^[0-9]$/.test(char);
	}
}
console.log(RNP.tokenize('123 + 1 + 2'));
console.log(RNP.shunting_yard(RNP.tokenize('123 + 1 + 2')));
console.log(RNP.calculate('123 + 1 + 2'));
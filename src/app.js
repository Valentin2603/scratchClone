const workspace = document.querySelector('.pole-raboti');
const blocks = document.querySelectorAll('.container-button');
const runButton = document.getElementById('runButton');
const terminalOutput = document.querySelector('.terminal-output');

let workspaceBlocks = [];
let draggedBlock = null;

function enableInnerDrop(container) {
    if (!container) return;

    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const mode = e.dataTransfer.getData('mode');

        if (mode === 'copy') {
            const type = e.dataTransfer.getData('type');
            if (!type) return;
            const newBlock = createWorkspaceBlock(type);
            container.appendChild(newBlock);
            rebuildWorkspaceBlocks();
            return;
        }

        if (mode === 'move') {
            if (!draggedBlock) return;
            container.appendChild(draggedBlock);
            draggedBlock = null;
            rebuildWorkspaceBlocks();
        }
    });
}

blocks.forEach((btn) => {
    btn.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('mode', 'copy');
        e.dataTransfer.setData('type', btn.dataset.type);
    });
});

workspace.addEventListener('dragover', (e) => {
    e.preventDefault();
});

workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.target && e.target.closest && e.target.closest('.droppable')) return;

    const mode = e.dataTransfer.getData('mode');

    if (mode === 'copy') {
        const type = e.dataTransfer.getData('type');
        if (!type) return;

        const newBlock = createWorkspaceBlock(type);
        insertBlockByMouseY(newBlock, e.clientY);
        rebuildWorkspaceBlocks();
        return;
    }

    if (mode === 'move') {
        if (!draggedBlock) return;
        insertBlockByMouseY(draggedBlock, e.clientY);
        draggedBlock = null;
        rebuildWorkspaceBlocks();
    }
});

function insertBlockByMouseY(blockElement, mouseY) {
    const allBlocks = workspace.querySelectorAll('.workspace-block');

    for (let i = 0; i < allBlocks.length; i++) {
        const b = allBlocks[i];
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

function createWorkspaceBlock(type) {
    const newBlock = document.createElement('div');
    newBlock.classList.add('workspace-block');
    newBlock.draggable = true;
    newBlock.dataset.type = type;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑';
    deleteBtn.classList.add('delete-btn');


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

        enableInnerDrop(newBlock.querySelector('.if-body'));
        enableInnerDrop(newBlock.querySelector('.else-body'));
    }
    else if (type === 'WHILE') {
        newBlock.innerHTML = `
            <div class="while-header">
                WHILE <input type = "text" class="block-input" placeholder="условие (пример: x < 10)">
            </div>
            <div class="while-body droppable"></div>
        `;

        enableInnerDrop(newBlock.querySelector('.while-body'));
    }

    newBlock.appendChild(deleteBtn);

    newBlock.addEventListener('dragstart', (e) => {
        draggedBlock = newBlock;
        e.dataTransfer.setData('mode', 'move');
    });

    deleteBtn.addEventListener('click', () => {
        newBlock.remove();
        rebuildWorkspaceBlocks();
    });

    workspace.appendChild(newBlock);

    const inputs = newBlock.querySelectorAll('input');

    if (type === 'new_value') {
        inputs[0].addEventListener('input', () => {
            newBlock.dataset.variables = inputs[0].value;
        });
    }
    else if (type === 'assign') {
        inputs[0].addEventListener('input', () => {
            newBlock.dataset.variable = inputs[0].value;
        });
        inputs[1].addEventListener('input', () => {
            newBlock.dataset.value = inputs[1].value;
        });
    }
    else if (type === 'create_array') {
        inputs[0].addEventListener('input', () => {
            newBlock.dataset.variable = inputs[0].value;
        });
        inputs[1].addEventListener('input', () => {
            newBlock.dataset.items = inputs[1].value;
        });
    }
    else if (type === 'IF') {
        inputs[0].addEventListener('input', () => {
            newBlock.dataset.condition = inputs[0].value;
        });
    }
    else if (type === 'WHILE') {
        inputs[0].addEventListener('input', () => {
            newBlock.dataset.condition = inputs[0].value;
        });
    }

    return newBlock;
}

function readBlock(b) {
    const obj = {
        type: b.dataset.type,
        data: {}
    };

    if (b.dataset.type === 'new_value') {
        obj.data.variables = b.dataset.variables || '';
    }
    else if (b.dataset.type === 'assign') {
        obj.data.variable = b.dataset.variable || '';
        obj.data.value = b.dataset.value || '';
    }
    else if (b.dataset.type === 'create_array') {
        obj.data.variable = b.dataset.variable || '';
        obj.data.items = b.dataset.items || '';
    }
    else if (b.dataset.type === 'IF') {
        obj.data.condition = b.dataset.condition || '';
        const ifBody = b.querySelector('.if-body');
        const elseBody = b.querySelector('.else-body');
        const ifBlocks = ifBody ? ifBody.querySelectorAll(':scope > .workspace-block') : [];
        const elseBlocks = elseBody ? elseBody.querySelectorAll(':scope > .workspace-block') : [];
        obj.then = Array.from(ifBlocks).map(readBlock);
        obj.else = Array.from(elseBlocks).map(readBlock);
    }
    else if (b.dataset.type === 'WHILE') {
        obj.data.condition = b.dataset.condition || '';
        const whileBody = b.querySelector('.while-body');
        const whileBlocks = whileBody ? whileBody.querySelectorAll(':scope > .workspace-block') : [];
        obj.body = Array.from(whileBlocks).map(readBlock);
    }

    return obj;
}

function rebuildWorkspaceBlocks() {
    const topBlocks = workspace.querySelectorAll(':scope > .workspace-block');
    workspaceBlocks = Array.from(topBlocks).map(readBlock);
}

runButton.addEventListener('click', () => {
    rebuildWorkspaceBlocks();
    terminalOutput.innerHTML = '';

    const vm = new Interpreter((s) => {
        const line = document.createElement('div');
        line.textContent = String(s);
        terminalOutput.appendChild(line);
    });

    try {
        vm.run(workspaceBlocks);
        vm.dump();
    } catch (e) {
        const line = document.createElement('div');
        line.textContent = 'Ошибка: ' + e.message;
        terminalOutput.appendChild(line);
    }
});

class Interpreter {
    constructor(printFn) {
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
            case 'new_value':
                this.declare(block.data.variables);
                break;
            case 'assign':
                this.assign(block.data.variable, block.data.value);
                break;
            case 'create_array':
                this.createArray(block.data.variable, block.data.items);
                break;
            case 'IF':
                this.execIf(block);
                break;
            case 'WHILE':
                this.execWhile(block);
                break;
            default:
                throw new Error('Неизвестный блок: ' + block.type);
        }
    }

    declare(csv) {
        const names = String(csv)
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        for (const name of names) {
            if (!/^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё_0-9]*$/.test(name)) {
                throw new Error('Некорректное имя переменной: ' + name);
            }
            if (!this.variables.has(name)) {
                this.variables.set(name, 0);
            }
        }
    }

    parseArrayAccess(text) {
        const source = String(text || '').trim();
        const match = source.match(/^([A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё_0-9]*)\[(.+)\]$/);

        if (!match) return null;

        return {
            arrayName: match[1],
            indexExpr: match[2].trim()
        };
    }

    resolveValue(token) {
        token = token.trim();

        const lengthMatch = token.match(/^length\(([A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё_0-9]*)\)$/);
        if (lengthMatch) {
            const arrayName = lengthMatch[1];

            if (!this.variables.has(arrayName)) {
                throw new Error(`Массив ${arrayName} не объявлен`);
            }

            const arr = this.variables.get(arrayName);

            if (!Array.isArray(arr)) {
                throw new Error(`${arrayName} не является массивом`);
            }

            return arr.length;
        }

        const arrAccess = this.parseArrayAccess(token);

        // arr[...]
        if (arrAccess) {
            const { arrayName, indexExpr } = arrAccess;

            if (!this.variables.has(arrayName)) {
                throw new Error(`Массив ${arrayName} не объявлен`);
            }

            const arr = this.variables.get(arrayName);

            if (!Array.isArray(arr)) {
                throw new Error(`${arrayName} не является массивом`);
            }

            const index = RNP.calculate(indexExpr, n => this.resolveValue(n));

            if (!Number.isInteger(index)) {
                throw new Error(`Индекс массива ${arrayName} должен быть целым числом`);
            }

            if (index < 0 || index >= arr.length) {
                throw new Error(`Индекс ${index} вне границ массива ${arrayName}`);
            }

            return arr[index];
        }

        // обычная переменная
        if (!this.variables.has(token)) {
            throw new Error(`Переменная ${token} не объявлена`);
        }

        return this.variables.get(token);
    }

    splitArrayItems(source) {
        const parts = [];
        let current = '';
        let bracketsDepth = 0;

        for (const char of String(source || '')) {
            if (char === '[') bracketsDepth += 1;
            if (char === ']') bracketsDepth -= 1;

            if (char === ',' && bracketsDepth === 0) {
                if (current.trim() !== '') parts.push(current.trim());
                current = '';
                continue;
            }

            current += char;
        }

        if (current.trim() !== '') parts.push(current.trim());
        return parts;
    }

    evaluateExpression(expr) {
        return RNP.calculate(expr, (token) => this.resolveValue(token));
    }

    createArray(name, items) {
        const arrayName = String(name || '').trim();
        const arrayItems = String(items || '').trim();

        if (!/^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё_0-9]*$/.test(arrayName)) {
            throw new Error('Некорректное имя массива: ' + arrayName);
        }

        const values = arrayItems.length === 0
            ? []
            : this.splitArrayItems(arrayItems).map((item) => this.evaluateExpression(item));

        this.variables.set(arrayName, values);
    }

    assign(name, expr) {
        const target = String(name || '').trim();
        const source = String(expr || '').trim();
        const arrTarget = this.parseArrayAccess(target);

        if (arrTarget) {
            const arrName = arrTarget.arrayName;
            const index = this.evaluateExpression(arrTarget.indexExpr);

            if (!Number.isInteger(index)) {
                throw new Error(`Индекс массива ${arrName} должен быть целым числом`);
            }

            if (!this.variables.has(arrName)) {
                throw new Error(`Массив ${arrName} не объявлен`);
            }

            const arr = this.variables.get(arrName);
            if (!Array.isArray(arr)) {
                throw new Error(`${arrName} не является массивом`);
            }
            if (index < 0 || index >= arr.length) {
                throw new Error(`Индекс ${index} вне границ массива ${arrName}`);
            }

            arr[index] = this.evaluateExpression(source);
            return;
        }

        if (!this.variables.has(target)) {
            throw new Error(`Переменная ${target} не объявлена`);
        }

        if (source.startsWith('[') && source.endsWith(']')) {
            this.createArray(target, source.slice(1, -1));
            return;
        }

        this.variables.set(target, this.evaluateExpression(source));
    }

    execIf(block) {
        const cond = String(block.data.condition || '').trim();
        if (cond.length === 0) throw new Error('Пустое условие IF');

        const ok = this.evalCondition(cond);
        if (ok) {
            if (block.then) this.run(block.then);
        } else {
            if (block.else) this.run(block.else);
        }
    }

    execWhile(block) {
        const cond = String(block.data.condition || '').trim();
        if (cond.length === 0) throw new Error('Пустое условие WHILE');

        let guard = 0;
        while (this.evalCondition(cond)) {
            if (block.body) this.run(block.body);
            guard += 1;
            if (guard > 10000) {
                throw new Error('Слишком много итераций в WHILE');
            }
        }
    }

    evalCondition(cond) {
        const m = cond.match(/^\s*(.+?)\s*(>=|<=|!=|=|>|<)\s*(.+?)\s*$/);
        if (!m) throw new Error('Некорректное условие: ' + cond);

        const left = this.evaluateExpression(m[1]);
        const right = this.evaluateExpression(m[3]);
        const op = m[2];

        switch (op) {
            case '>': return left > right;
            case '<': return left < right;
            case '=': return left === right;
            case '!=': return left !== right;
            case '>=': return left >= right;
            case '<=': return left <= right;
            default: return false;
        }
    }

    dump() {
        this.print('Переменные:');

        for (const [k, v] of this.variables) {
            if (Array.isArray(v)) {
                this.print(`${k} = [${v.join(', ')}]`);
            } else {
                this.print(`${k} = ${v}`);
            }
        }
    }
}

class RNP {
    static ops_priority = {
        '+': 2,
        '-': 2,
        '%': 3,
        '*': 3,
        '/': 3,
        'u-': 4,
        '^': 5,
    }

    parseArrayAccess(text) {
        text = text.trim();

        const match = text.match(/^([A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё_0-9]*)\[(.+)\]$/);

        if (!match) return null;

        return {
            arrayName: match[1],
            indexExpr: match[2].trim()
        };
    }

    static calculate(expression, resolver) {

        const tokens = RNP.tokenize(expression);

        const rpn = RNP.shunting_yard(tokens);

        const stack = [];

        for (const token of rpn) {

            if (!isNaN(token)) {
                stack.push(Number(token));
                continue;
            }

            if (token === 'u-') {
                const value = stack.pop();
                stack.push(-value);
                continue;
            }

            if (["+", "-", "*", "/", "%", "^"].includes(token)) {

                const b = stack.pop();
                const a = stack.pop();

                switch (token) {
                    case "+": stack.push(a + b); break;
                    case "-": stack.push(a - b); break;
                    case "*": stack.push(a * b); break;
                    case "/":
                        if (b === 0) throw new Error("Деление на ноль");
                        stack.push(Math.floor(a / b));
                        break;
                    case "%": stack.push(a % b); break;
                    case "^": stack.push(a ** b); break;
                }

                continue;
            }

            // переменная
            stack.push(resolver(token));
        }

        if (stack.length !== 1)
            throw new Error("Некорректное выражение");

        return stack[0];
    }

    static tokenize(expression) {
        const tokens = [];
        const source = String(expression || '');
        let i = 0;

        while (i < source.length) {
            const char = source[i];

            if (/\s/.test(char)) {
                i += 1;
                continue;
            }

            if (this.isDigit(char)) {
                let value = char;
                i += 1;

                while (i < source.length && this.isDigit(source[i])) {
                    value += source[i];
                    i += 1;
                }

                tokens.push(value);
                continue;
            }

            if (this.isLetter(char) || char === '_') {
                let value = char;
                i += 1;

                while (i < source.length && this.isVariableSymbol(source[i])) {
                    value += source[i];
                    i += 1;
                }

                if (i < source.length && source[i] === '(') {
                    let depth = 0;
                    let suffix = '';

                    while (i < source.length) {
                        const c = source[i];
                        suffix += c;

                        if (c === '(') depth += 1;
                        if (c === ')') {
                            depth -= 1;
                            if (depth === 0) {
                                i += 1;
                                break;
                            }
                        }

                        i += 1;
                    }

                    value += suffix;
                    tokens.push(value);
                    continue;
                }

                if (i < source.length && source[i] === '[') {
                    let depth = 0;
                    let suffix = '';

                    while (i < source.length) {
                        const c = source[i];
                        suffix += c;

                        if (c === '[') depth += 1;
                        if (c === ']') {
                            depth -= 1;
                            if (depth === 0) {
                                i += 1;
                                break;
                            }
                        }

                        i += 1;
                    }

                    value += suffix;
                }

                tokens.push(value);
                continue;
            }

            if (['+', '-', '*', '/', '%', '^', '(', ')'].includes(char)) {
                tokens.push(char);
                i += 1;
                continue;
            }

            throw new Error('Неизвестный символ в выражении: ' + char);
        }

        return tokens;
    }

    static shunting_yard(tokens) {
        const queue = [];
        const stack = [];

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

    assign(name, expr) {
        name = name.trim();
        expr = expr.trim();

        const arrTarget = this.parseArrayAccess(name);

        // запись в элемент массива: arr[i] = ...
        if (arrTarget) {
            const { arrayName, indexExpr } = arrTarget;

            if (!this.variables.has(arrayName)) {
                throw new Error(`Массив ${arrayName} не объявлен`);
            }

            const arr = this.variables.get(arrayName);

            if (!Array.isArray(arr)) {
                throw new Error(`${arrayName} не является массивом`);
            }

            const index = RNP.calculate(indexExpr, n => this.resolveValue(n));

            if (!Number.isInteger(index)) {
                throw new Error(`Индекс массива ${arrayName} должен быть целым числом`);
            }

            if (index < 0 || index >= arr.length) {
                throw new Error(`Индекс ${index} вне границ массива ${arrayName}`);
            }

            const value = RNP.calculate(expr, n => this.resolveValue(n));
            arr[index] = value;
            return;
        }

        // обычная переменная
        if (!this.variables.has(name)) {
            throw new Error(`Переменная ${name} не объявлена`);
        }

        // создание массива: arr = [1, 2, x+3]
        if (expr.startsWith("[") && expr.endsWith("]")) {
            const inside = expr.slice(1, -1).trim();

            if (inside === "") {
                this.variables.set(name, []);
                return;
            }

            const parts = [];
            let current = "";
            let bracketDepth = 0;

            for (let i = 0; i < inside.length; i++) {
                const ch = inside[i];

                if (ch === "[" ) bracketDepth++;
                if (ch === "]" ) bracketDepth--;

                if (ch === "," && bracketDepth === 0) {
                    parts.push(current.trim());
                    current = "";
                } else {
                    current += ch;
                }
            }

            if (current.trim() !== "") {
                parts.push(current.trim());
            }

            const values = parts.map(part => RNP.calculate(part, n => this.resolveValue(n)));
            this.variables.set(name, values);
            return;
        }

        // обычное выражение
        const value = RNP.calculate(expr, n => this.resolveValue(n));
        this.variables.set(name, value);
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

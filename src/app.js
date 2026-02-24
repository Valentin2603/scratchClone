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
		else if (b.dataset.type === "IF") {
			obj.data.condition = b.dataset.condition || "";
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
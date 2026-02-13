const workspace = document.getElementById("workspace")
const palette = document.getElementById("palette")

let workspaceBlocks = [];

palette.addEventListener("click", function(event) {
    const clicked = event.target;

    if (clicked.classList.contains("block")) {
        const newBlock = document.createElement("div");
        newBlock.textContent = clicked.textContent;
        newBlock.className = "block";
        newBlock.dataset.type = clicked.dataset.type;

        workspace.appendChild(newBlock);

        workspaceBlocks.push({
            type: newBlock.dataset.type,
            element: newBlock
        });

        console.log(workspaceBlocks);
    }

})
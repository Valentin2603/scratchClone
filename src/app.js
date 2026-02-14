const workspace = document.querySelector(".pole-raboti")
const blocks = document.querySelectorAll(".container-button")
const terminal = document.querySelector(".terminal");


let workspaceBlocks = [];

blocks.forEach (block => {
    block.addEventListener("click", function(event) {
        const clicked = event.target;
        console.log("Клик по блоку");

        
        const newBlock = block.cloneNode(true);
        newBlock.classList.add("workspace-block");
    
        workspace.appendChild(newBlock);

        workspaceBlocks.push({
            type: newBlock.dataset.type,
            element: newBlock
        });

        console.log(workspaceBlocks);
        
    })
})
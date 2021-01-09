const options = document.querySelector("#options");
const clfAddr = document.querySelector("#clf-addr");
const clsAddr = document.querySelector("#cls-addr");
const vlsm = document.querySelector("#vlsm");

options.addEventListener("click", (e) => {
    const parentDiv = e.target.parentElement;
    switch (e.target.id) {
        case "clf-option":
            parentDiv.children[0].classList.add("current-option");
            clfAddr.classList.add("shown");
            clfAddr.classList.remove("hidden");
            parentDiv.children[1].classList.remove("current-option");
            clsAddr.classList.remove("shown");
            clsAddr.classList.add("hidden");
            parentDiv.children[2].classList.remove("current-option");
            vlsm.classList.remove("shown");
            vlsm.classList.add("hidden");
            break;
        case "cls-option":
            parentDiv.children[0].classList.remove("current-option");
            clfAddr.classList.remove("shown");
            clfAddr.classList.add("hidden");
            parentDiv.children[1].classList.add("current-option");
            clsAddr.classList.add("shown");
            clsAddr.classList.remove("hidden");
            parentDiv.children[2].classList.remove("current-option");
            vlsm.classList.remove("shown");
            vlsm.classList.add("hidden");
            break;
        case "vlsm-option":
            parentDiv.children[0].classList.remove("current-option");
            clfAddr.classList.remove("shown");
            clfAddr.classList.add("hidden");
            parentDiv.children[1].classList.remove("current-option");
            clsAddr.classList.remove("shown");
            clsAddr.classList.add("hidden");
            parentDiv.children[2].classList.add("current-option");
            vlsm.classList.add("shown");
            vlsm.classList.remove("hidden");
            break;

        default:
            console.warn("weird");
            break;
    }
});

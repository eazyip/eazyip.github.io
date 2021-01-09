document.querySelector("#rad").style.height =
    window.scrollY +
    document.querySelector("#services").getBoundingClientRect().top +
    "px";
window.addEventListener("resize", () => {
    const svgHeight = document
        .querySelector("#services")
        .getBoundingClientRect().top;

    document.querySelector("#rad").style.height =
        window.scrollY + svgHeight + "px";
});

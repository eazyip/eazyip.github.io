//*******************************************************
// register service worker
//*******************************************************
// if ("serviceWorker" in navigator) {
//     navigator.serviceWorker
//         .register("/sw.js")
//         .then(function () {
//             console.log("Service worker registered!");
//         })
//         .catch(function (err) {
//             console.error(err);
//         });
// }

//*******************************************************
// nav bar
//*******************************************************
if (window.location.pathname === "/app.html") {
    document.querySelector("#js-nav-app").classList.add("active-app");
    document.querySelector("#js-nav-app").classList.remove("inactive-app");
} else if (
    window.location.pathname === "/" ||
    window.location.pathname === "/pages" ||
    window.location.pathname === "/index.html"
)
    document.querySelector("#js-nav-home").classList.add("current-nav-option");
else if (window.location.pathname === "/about.html")
    document.querySelector("#js-nav-about").classList.add("current-nav-option");
else if (window.location.pathname === "/contact.html")
    document
        .querySelector("#js-nav-contact")
        .classList.add("current-nav-option");

//*******************************************************
// darkmode.js
//*******************************************************
// function addDarkmodeWidget() {
//     new Darkmode().showWidget();
// }
// window.addEventListener("load", addDarkmodeWidget);

//*******************************************************
// record visit
//*******************************************************
// if (sessionStorage.getItem("visit") !== "recorded") {
//     fetch(`${window.location.origin}/apis/visit`)
//         .then((res) => {
//             // console.log(res);

//             if (res.status === 200) {
//                 return res.text();
//             } else {
//                 throw "server err";
//             }
//         })
//         .then((text) => {
//             // console.log(text);

//             if (text === "recorded") sessionStorage.setItem("visit", text);
//             else throw "backend err";
//         })
//         .catch((err) => {
//             sessionStorage.setItem("visit", err);
//         });
// }

const contactForm = document.querySelector("#contact-form");
const contactMsgStatus = document.querySelector("#js-contact-msg-status");
const contactSubmitBtn = document.querySelector("#js-contact-submit-btn");

contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (contactSubmitBtn.classList.contains("disabled-btn")) return;

    contactSubmitBtn.classList.add("disabled-btn");

    const formData = new FormData(contactForm);

    // const name = formData.get("name");
    // const email = formData.get("email");
    // const msg = formData.get("msg");

    fetch(`${window.location.origin}/apis/contact`, {
        method: "post",
        body: formData,
    })
        .then((res) => res.text())
        .then((text) => {
            if (text === "nice msg") {
                contactMsgStatus.innerHTML =
                    "<p class='success-text'>We recieved your message. Thank you :)</p>";
                contactSubmitBtn.classList.remove("disabled-btn");
            } else if (text !== "nice msg") {
                throw "backend err";
            }
        })
        .catch(() => {
            contactMsgStatus.innerHTML =
                "<p class='alarming-text'>A server error happened! please try another medium to pass your massege (An email maybe)</p>";
        });
});

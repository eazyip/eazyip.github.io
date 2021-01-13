const contactForm = document.querySelector("#contact-form");
const contactMsgStatus = document.querySelector("#js-contact-msg-status");
const contactSubmitBtn = document.querySelector("#js-contact-submit-btn");

contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    contactSubmitBtn.style.display = "none";

    const formData = new FormData(contactForm);

    fetch("https://formsubmit.io/send/c31046ea-9e1f-4bb6-8150-cd6b88af1020", {
        mode: "cors",
        method: "post",
        body: formData,
    })
        .then((res) => {
            if (res.status < 400) {
                contactMsgStatus.innerHTML =
                    "<p class='success-text'>We recieved your message. Thank you :)</p>";
            } else {
                throw "backend err";
            }
        })
        .catch(() => {
            contactMsgStatus.innerHTML =
                "<p class='alarming-text'>A server error happened! please try another medium to pass your massege (A direct email maybe)</p>";
        });
});

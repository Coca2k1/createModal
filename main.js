const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
let currentModal = null;

// $$("[data-modal]").forEach((btn) => {
//     btn.onclick = function () {
//         const modal = $(this.dataset.modal);

//         if (modal) {
//             Popzy.classList.add("popzy__show");
//             currentModal = modal;
//         } else {
//             console.error(`${this.dataset.modal} doesn't exist!`);
//         }
//     };
// });

// $$(".popzy__close").forEach((btn) => {
//     btn.onclick = function () {
//         const modal = this.closest(".popzy__backdrop");
//         if (modal) {
//             Popzy.classList.remove("popzy__show");
//             currentModal = null;
//         }
//     };
// });

// $$(".popzy__backdrop").forEach((modal) => {
//     Popzy.onclick = function (e) {
//         if (e.target === this) {
//             this.classList.remove("popzy__show");
//             currentModal = null;
//         }
//     };
// });

// document.addEventListener("keydown", (e) => {
//     if (e.key === "Escape" && currentModal) {
//         currentPopzy.classList.remove("popzy__show");
//         currentModal = null;
//     }
// });

//  <div id="popzy__2" class="popzy__backdrop">
//             <div class="popzy__container">
//                 <button class="popzy__close">&times;</button>
//                 <div class="popzy__content">
//                     <p>Modal 2.</p>
//                 </div>
//             </div>
//         </div>

Popzy.elements = [];

Popzy.prototype._getScrollBarWidth = function () {
    if (this._scrollBarWidth) return this._scrollBarWidth;

    const div = document.createElement("div");

    Object.assign(div.style, {
        position: "absolute",
        top: "-999px",
        overflow: "scroll",
    });

    document.body.append(div);

    this._scrollBarWidth = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);

    return this._scrollBarWidth;
};

Popzy.prototype._build = function () {
    const content = this.template.content.cloneNode(true);

    // create modal elements

    this._backdrop = document.createElement("div");
    this._backdrop.className = "popzy__backdrop";

    const container = document.createElement("div");
    container.className = "popzy__container";

    const modalContent = document.createElement("div");
    modalContent.className = "popzy__content";

    // Append content and element
    modalContent.appendChild(content);
    container.append(modalContent);

    if (!this.opt.footer) {
        container.style.paddingBottom = "40px";
    }

    // footer
    if (this.opt.footer) {
        this._modalFooter = document.createElement("div");
        this._modalFooter.className = "popzy__footer";

        this._renderFooterContent();
        this._renderFooterButtons();

        container.append(this._modalFooter);
    }

    this._backdrop.append(container);
    document.body.append(this._backdrop);

    if (this._allowButtonClose) {
        // const closeBtn = document.createElement("button");
        // closeBtn.className = "popzy__close";
        // closeBtn.innerHTML = "&times";
        const closeBtn = this._createButton("&times", "popzy__close", () =>
            this.close()
        );
        container.append(closeBtn);

        // closeBtn.onclick = () => this.close();
    }

    // Add more cssClass on container
    this.opt.cssClass.forEach((css) => {
        if (typeof css === "string") {
            container.classList.add(css);
        }
    });
};

Popzy.prototype._renderFooterContent = function () {
    if (this._footerContent && this._modalFooter) {
        this._modalFooter.innerHTML = this._footerContent;
    }
};

// setFooterContent to insert content on footer
Popzy.prototype.setFooterContent = function (html) {
    this._footerContent = html;
    this._renderFooterContent();
};

// add footerButton
Popzy.prototype._createButton = function (title, cssClass, callback) {
    const button = document.createElement("button");
    button.className = cssClass;
    button.innerHTML = title;
    button.onclick = callback;

    return button;
};

Popzy.prototype._renderFooterButtons = function () {
    if (this._modalFooter) {
        this._footerButton.forEach((btn) => {
            this._modalFooter.append(btn);
        });
    }
};

Popzy.prototype.addFooterButton = function (title, cssClass, callback) {
    const button = this._createButton(title, cssClass, callback);

    this._footerButton.push(button);

    this._renderFooterButtons();
};

Popzy.prototype._handleEscapeKey = function (e) {
    const lastModal = Popzy.elements[Popzy.elements.length - 1];
    if (e.key === "Escape" && this === lastModal) {
        this.close();
    }
};

// open modal
Popzy.prototype.open = function () {
    Popzy.elements.push(this);
    if (!this._backdrop) {
        this._build();
    }

    setTimeout(() => {
        this._backdrop.classList.add("popzy--show");
    }, 0);

    // Attack eventListeners
    if (this._allowBackdropClose) {
        this._backdrop.onclick = (e) => {
            if (e.target === this._backdrop) {
                this.close();
            }
        };
    }

    // ESC: after close modal, need to remove listener
    if (this._allowEscapeClose) {
        document.addEventListener("keydown", this._handleEscapeKey);
    }

    // hidden scroll and handle problem about scroll when modal appear/disappear
    document.body.style.paddingRight = this._getScrollBarWidth() + "px";
    document.body.classList.add("popzy--no-scroll");

    // onOpen()
    this._onTransitionEnd(this.opt.onOpen);

    return this._backdrop;
};

Popzy.prototype._onTransitionEnd = function (callback) {
    this._backdrop.ontransitionend = (e) => {
        if (e.propertyName !== "opacity") return;
        if (typeof callback === "function") callback();
    };
};

// close modal: remove element modal
Popzy.prototype.close = function (destroy = this.opt.destroyOnClose) {
    Popzy.elements.pop();
    this._backdrop.classList.remove("popzy--show");

    // when transition end, remove backdrop from DOM
    this._onTransitionEnd(() => {
        if (this._backdrop && destroy) {
            this._backdrop.remove();
            this._backdrop = null;
            this._modalFooter = null;
        }

        if (typeof this.opt.onClose === "function") this.opt.onClose();

        if (this._allowEscapeClose) {
            document.removeEventListener("keydown", this._handleEscapeKey);
        }

        if (!Popzy.elements.length) {
            document.body.classList.remove("popzy--no-scroll");
            document.body.style.paddingRight = "";
        }
    });
};

this.destroy = function () {
    this.close(true);
};

function Popzy(options = {}) {
    this.opt = Object.assign(
        {
            closeMethods: ["button", "overlay", "Escape"],
            destroyOnClose: true,
            cssClass: [],
            footer: false,
        },
        options
    );

    this.template = $(`#${this.opt.templateId}`);

    if (!this.template) {
        console.error(`#${this.opt.templateId} doesn't exist!`);
        return;
    }

    const { closeMethods } = this.opt;
    this._allowBackdropClose = closeMethods.includes("overlay");
    this._allowButtonClose = closeMethods.includes("button");
    this._allowEscapeClose = closeMethods.includes("Escape");

    this._footerButton = [];
    this._handleEscapeKey = this._handleEscapeKey.bind(this);
}

const modal1 = new Popzy({
    templateId: "modal-1",
    closeMethods: ["Escape", "overlay"],
    cssClass: ["class1", "class2", "class3"],
    footer: true,
    // setFooterContent: "<p>Footer content1</p>",
    onOpen: () => {
        console.log("Modal1 opened!");
    },
    onClose: () => {
        console.log("Modal1 closed!");
    },
});

const modal2 = new Popzy({
    templateId: "modal-2",
    closeMethods: ["overlay", "Escape"],
    onOpen: () => {
        console.log("Modal2 opened!");
    },
    onClose: () => {
        console.log("Modal2 Closed!");
    },
    footer: true,
});

const modal3 = new Popzy({
    templateId: "modal-3",
    cssClass: ["hello", "hahaha", "leuleu"],
    // destroyOnClose: false,
    onOpen: () => {
        console.log("Modal3 opened!");
    },
    onClose: () => {
        console.log("Modal3 Closed!");
    },
    destroyOnClose: false,
});

// $("#open-modal1").onclick = function () {
//     Popzy.open("<p class='font-bold text-red-500'>Modal content 1....</p>");
// };

// $("#open-modal2").onclick = function () {
//     Popzy.open("<p class='font-bold text-yellow-600'>Modal content 2....</p>");
// };

// $("#open-modal3").onclick = function () {
//     Popzy.open("<p class='font-bold text-green-500'>Modal content 3....</p>");
// };

// Click button to open Modals
$("#open-modal1").onclick = function () {
    modal1.open();
};

$("#open-modal2").onclick = function () {
    const modalElement = modal2.open();

    const form = modalElement.querySelector("#login-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const formData = {
                email: $("#email").value.trim(),
                passWord: $("#password").value.trim(),
            };

            if (!formData.email.length || !formData.passWord.length) {
                alert("Please fill in your email and password!");
            } else {
                alert("You signed up successfully!");
                console.log(formData);
            }
        });
    }
};

$("#open-modal3").onclick = function () {
    modal3.open();
};

// modal2.setFooterContent("<p>Please sign in your account</p>");

modal1.addFooterButton(
    "Danger",
    "popzy__btn popzy__btn--primary popzy__btn--pull-left",
    function () {
        alert(
            "If you click this button. Your nick is hacked by scam. Please be carefully!"
        );
    }
);

modal1.addFooterButton("Open Modal3", "popzy__btn", () => {
    modal3.open();
});

modal1.addFooterButton("Cancel", "popzy__btn popzy__btn--primary", () => {
    if (confirm("Are you sure to close this Modal?")) {
        modal1.close(true);
    }
});

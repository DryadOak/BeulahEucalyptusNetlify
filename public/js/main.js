"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // Define contact information
    (function () {
        const contactInfo = {
            email: "esther@beulaheucalyptus.co.uk",
            tel: "07853 535313",
        };

        const emailContainer = document.querySelector(".emailContainer");
        const telContainer = document.querySelectorAll(".telContainer");

        if (emailContainer) {
            emailContainer.innerHTML += `<a href="mailto:${contactInfo.email}">${contactInfo.email}</a>`;
        }

        if (telContainer.length > 0) {
            telContainer.forEach((telContainer) => {
                telContainer.innerHTML += `<a href="tel:${contactInfo.tel}">${contactInfo.tel}</a>`;
            });
        }
    })();

    // Display current year
    const currentYearElement = document.querySelector("#currentYear");
    const currentYear = new Date().getFullYear();
    currentYearElement.innerHTML += currentYear;

    // Review toggle
    const reviewBtn = document.getElementById("review-button");
        if(reviewBtn){
            const collapsibleForm = document.querySelector(".collapsible-form")
            reviewBtn.addEventListener("click", () => {
            collapsibleForm.toggleAttribute("data-visible");
            });
        }
    
    // Navigation
    const mobileNavToggle = document.querySelector(".mobile-nav-menu-btn");
    const primaryNavigation = document.querySelector(".primary-navigation");
    const primaryHeader = document.querySelector(".primary-header");

    mobileNavToggle.addEventListener("click", () => {
        primaryHeader.toggleAttribute("data-overlay");
        primaryNavigation.toggleAttribute("data-visible");
    });

    // Slider
    const sliderElement = document.querySelector(".slider");
    if (sliderElement) {
        const slider = new A11YSlider(sliderElement, {
            adaptiveHeight: true,
            dots: true,
        });
    }

    // Prevent default anchor tag behavior on touch devices
    if ("ontouchstart" in window || navigator.maxTouchPoints) {
        const anchorTag = document.getElementById("home");
        anchorTag.addEventListener("click", function (event) {
            event.preventDefault();
        });
    }

    // Creates loading effect for smoother img rendering by adding an effect class
    const blurDivs = document.querySelectorAll(".blur-load");
    if (blurDivs.length > 0) {
        applyLoadingEffect(blurDivs, "loaded");
    }

    function applyLoadingEffect(selector, effectClass) {
        selector.forEach((effectDiv) => {
            const img = effectDiv.querySelector("img");

            function handleLoadEffect() {
                effectDiv.classList.add(effectClass);
            }

            if (img.complete) {
                handleLoadEffect();
            } else {
                img.addEventListener("load", handleLoadEffect);
            }
        });
    }

    // Form handling
    const formConfigs = [
        {
            formId: "contact-form",
            messageContainerId: "contact-message-container",
            route: "/app/contact",
        },
        {
            formId: "review-form",
            messageContainerId: "review-message-container",
            route: "/app/",
        },
        // Add more forms and message containers here
    ];

    formConfigs.forEach(({ formId, messageContainerId, route }) => {
        const form = document.getElementById(formId);
        const messageContainer = document.getElementById(messageContainerId);
        const submitButton = document.querySelector("button.expand")

        if (form) {
            form.addEventListener("submit", async function (event) {
                event.preventDefault();
                submitButton.classList.add("loading");
                await handleFormSubmit(form, messageContainer, route);
            });
        }
    });

    async function handleFormSubmit(form, messageContainer, route) {
        const formData = new URLSearchParams();
        for (const element of form.elements) {
            if (element.name) {
                formData.append(element.name, element.value);
            }
        }

        try {
            const response = await fetch(route, {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });

            const data = await response.json();
            console.log(data)
            if (data.errors) {
                submitButton.classList.add("finished");
				        setTimeout(() => {
                            submitButton.classList.remove("loading");
				        	submitButton.classList.remove("finished");
				        	submitButton.disabled = false;
				        }, 1500);
                displayFormErrors(messageContainer, data.errors);
            } else if (data.message) {
                submitButton.classList.add("loaded");
				        submitButton.classList.add("finished");
                        form.reset()
				        setTimeout(() => {
				        	submitButton.classList.remove("finished");
				        	submitButton.classList.remove("loaded");
				        	submitButton.classList.remove("loading");
				        	submitButton.disabled = false;
				        }, 1500);
                displayFormSuccess(messageContainer, data.message);
            } else if (!response.ok) {
                console.error("Server responded with an error");
            }
        } catch (error) {
            console.error(error);
        }
    }

    function displayFormErrors(messageContainer, errors) {
        messageContainer.innerHTML = "";
        errors.forEach((error) => {
            const errorDiv = document.createElement("div");
            errorDiv.textContent = error;
            messageContainer.appendChild(errorDiv);
        });
        messageContainer.classList.remove("hidden");
        messageContainer.classList.add("formMsg", "bg-warning");
    }

    function displayFormSuccess(messageContainer, message) {
        messageContainer.textContent = message;
        messageContainer.classList.remove("hidden", "bg-warning");
        messageContainer.classList.add("formMsg", "bg-primary-200");
    }

});

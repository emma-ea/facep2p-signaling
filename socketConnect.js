const socket = io.connect("https://localhost:3001/", {
  auth: {
    username,
    password,
  },
});

socket.on("connect", () => {
  console.log("connected to server");
});

socket.on("available-offers", (offers, callback) => {
  console.log("getting offers");
  createOfferEls(offers);
});

socket.on("new-offer-awaiting", (newOffer, callbacak) => {
  console.log("new offer", JSON.stringify(newOffer));
  createOfferEls(newOffer);
});

const createOfferEls = (offers) => {
  const answerEl = document.querySelector("#answer");
  offers.forEach((offer) => {
    const newOfferEl = document.createElement("div");
    newOfferEl.innerHTML = `<button class='btn btn-success col-1'> ${offer.offererUsername}</button>`;
    newOfferEl.addEventListener("click", (e) => answerOffer(offer));
    answerEl.appendChild(newOfferEl);
  });
};

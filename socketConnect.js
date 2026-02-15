const socket = io("ws://localhost:9191/", {
  auth: {
    username,
    password,
  },
  query: {
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
  console.log("new offer", newOffer);
  createOfferEls([JSON.parse(newOffer)]);
});

socket.on("answer-response", (offerObj, callback) => {
  console.log(offerObj);
  addAnswer(offerObj);
});

socket.on("receive-ice-candidates", (iceCandidates, callback) => {
  console.log(iceCandidates);
  addNewIceCandidate(iceCandidates);
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

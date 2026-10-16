const wildfireArrow = document.getElementById("wildfireArrow");
const wildfireInfo = document.getElementById("wildfireInfo");
const photosynthesisArrow = document.getElementById("photosynthesisArrow");
const photosynthesisInfo = document.getElementById("photosynthesisInfo");
const absorptionArrow = document.getElementById("absorptionArrow");
const absorptionInfo = document.getElementById("absorptionInfo");
const fossilFuelArrow = document.getElementById("fossilFuelArrow");
const fossilFuelInfo = document.getElementById("fossilFuelInfo");
const erosionArrow = document.getElementById("erosionArrow");
const erosionInfo = document.getElementById("erosionInfo");

function toggleInfo(object) {
  const isGrowing = object.classList.contains("grow");
  object.classList.remove("grow", "shrink");
  void object.offsetWidth;
  object.classList.add(isGrowing ? "shrink" : "grow");
}

function hideInfo(object) {
  object.classList.remove("grow", "shrink");
  void object.offsetWidth;
  object.classList.add("shrink");
}

function toggleBigInfo(object) {
  const isGrowing = object.classList.contains("growBig");
  object.classList.remove("growBig", "shrinkBig");
  void object.offsetWidth;
  object.classList.add(isGrowing ? "shrinkBig" : "growBig");
}

function hideBigInfo(object) {
  object.classList.remove("growBig", "shrinkBig");
  void object.offsetWidth;
  object.classList.add("shrinkBig");
}

wildfireArrow.addEventListener("click", toggleBigInfo.bind(null, wildfireInfo));
wildfireInfo.addEventListener("click", hideBigInfo.bind(null, wildfireInfo));
photosynthesisArrow.addEventListener("click", toggleInfo.bind(null, photosynthesisInfo));
photosynthesisInfo.addEventListener("click", hideInfo.bind(null, photosynthesisInfo));
absorptionArrow.addEventListener("click", toggleInfo.bind(null, absorptionInfo));
absorptionInfo.addEventListener("click", hideInfo.bind(null, absorptionInfo));
fossilFuelArrow.addEventListener("click", toggleInfo.bind(null, fossilFuelInfo));
fossilFuelInfo.addEventListener("click", hideInfo.bind(null, fossilFuelInfo));
erosionArrow.addEventListener("click", toggleInfo.bind(null, erosionInfo));
erosionInfo.addEventListener("click", hideInfo.bind(null, erosionInfo));

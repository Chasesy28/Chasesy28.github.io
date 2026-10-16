const wildfireArrow = document.getElementById("wildfireArrow");
const wildfireInfo = document.getElementById("wildfireInfo");
const photosynthesisArrow = document.getElementById("photosynthesisArrow");
const photosynthesisInfo = document.getElementById("photosynthesisInfo");

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

wildfireArrow.addEventListener("click", toggleInfo.bind(null, wildfireInfo));
wildfireInfo.addEventListener("click", hideInfo.bind(null, wildfireInfo));
photosynthesisArrow.addEventListener("click", toggleInfo.bind(null, photosynthesisInfo));
photosynthesisInfo.addEventListener("click", hideInfo.bind(null, photosynthesisInfo));

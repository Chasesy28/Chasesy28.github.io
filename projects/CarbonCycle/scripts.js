const wildfireArrow = document.getElementById("wildfireArrow");
const wildfireInfo = document.getElementById("wildfireInfo");

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

const box = document.getElementById("box");

box.addEventListener("click", () => {
  const isGrowing = box.classList.contains("grow");
  box.classList.remove("grow", "shrink");
  void box.offsetWidth;
  box.classList.add(isGrowing ? "shrink" : "grow");
});

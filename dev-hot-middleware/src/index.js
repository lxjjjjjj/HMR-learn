let inputEl = document.createElement("input");
document.body.appendChild(inputEl);

let divEl = document.createElement("div")
document.body.appendChild(divEl);
let btnEl = document.createElement("button")
let render = () => {
    let content = require("./content").default;
    divEl.innerText = content;
    btnEl.innerText = content;
}
render();

if (module.hot) {
    module.hot.accept(["./content.js"], render);
}
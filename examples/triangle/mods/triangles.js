const DIV = 1;
const COLS = Math.trunc(window.innerWidth / DIV);
const ROWS = Math.trunc(window.innerHeight / DIV);

const range_random = function(f, t) {
    return Math.trunc(Math.random() * (t-f+1) + f);
}

const add_dot = function(dots) {
    const A = dots[range_random(0,2)];
    const B = dots.slice(-1)[0];
    const C = {
        x: Math.trunc((A.x + B.x) / 2),
        y: Math.trunc((A.y + B.y) / 2)
    };
    dots.push(C);
}

sandbox.datas = {
    dots: [ ]
};
sandbox.preload_tpls = ['tpls/triangles.html'];
sandbox.tpl_id = 'triangles';
sandbox.name = 'triangles';
sandbox.target = document.querySelector('#main');

sandbox.oninit = function(){
    const dots = [
        {x: range_random(0, COLS) * DIV, y: range_random(0, ROWS) * DIV},
        {x: range_random(0, COLS) * DIV, y: range_random(0, ROWS) * DIV},
        {x: range_random(0, COLS) * DIV, y: range_random(0, ROWS) * DIV},
        {x: range_random(0, COLS) * DIV, y: range_random(0, ROWS) * DIV}
    ];
    for (let i = 0; i < 3000; i++) add_dot(dots);
    this.dots = dots;
};
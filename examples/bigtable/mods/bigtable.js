const ROWS = 30, COLS = 60;

sandbox.datas = {
    table: [...Array(ROWS).keys()].map( _ =>
        [...Array(COLS).keys().map(_=>[{c: '', v: 0}][0])]
    ),
    uls: [
        [1,2,3,4,5,6],
        [1,2,3,4,5,6],
        [1,2,3,4,5,6],
        [1,2,3,4,5,6],
        [1,2,3,4,5,6],
    ],
    change: function() {
        const r = Math.trunc(Math.random()*ROWS);
        const c = Math.trunc(Math.random()*COLS);
        this.table[r][c] = {c: 'filled', v: +(Math.random()*20).toFixed(0)};
    }
};
sandbox.tpl_id = 'table';
sandbox.name = 'main';
sandbox.target = document.querySelector('#main');

const ROWS = 3, COLS = 6;

sandbox.datas = {
    table: [...Array(ROWS).keys()].map( r =>
        [...Array(COLS).keys().map(c => [{c: '', v: r}][0])]
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
        this.table[r][c] = {c: 'filled', v: +(Math.random()*9).toFixed(0)};
        setTimeout(()=>this.change(), 500);
    }
};
sandbox.tpl_id = 'table';
sandbox.name = 'main';
sandbox.target = document.querySelector('#main');

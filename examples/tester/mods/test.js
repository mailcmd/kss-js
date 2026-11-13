sandbox.datas = {
        text: 'Holas',
        value: 99,
        label: 'etiqueta',
        form: {
            a: {key: 'key1', value: '10'},
            b: {key: 'key2', value: '20'},
        },
        sum: function() {
            this.value++;
        },
        add: function() {
            const k = String.fromCharCode(this.value++);
            this.get('.form').push({key: 'key_'+k, value: (new Date()).getTime()}, 'c');
        }
};
sandbox.preload_tpls = ['tpls/test.html'];
sandbox.tpl_id = 'test';
sandbox.name = 'test';
sandbox.target = document.querySelector('#main');

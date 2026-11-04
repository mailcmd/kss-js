sandbox.datas = {
        text: 'Holas',
        value: 1,
        sum: function() {
            this.value++;
        },
        label: 'etiqueta',
        form: {
            a: {key: 'key1', value: '20'},
            b: {key: 'key2', value: '10'},
        }
};
sandbox.tpl_id = 'test';
sandbox.name = 'main';
sandbox.target = document.querySelector('#main');

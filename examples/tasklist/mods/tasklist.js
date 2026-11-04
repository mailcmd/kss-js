
sandbox.datas = {
    tasks: [],
    text: '',
    list_add: function() {
        const new_item = {
            description: this.text.valueOf()
        };
        this.tasks.push(new_item);
        this.text = '';
    },
    list_del: function(i) {
        this.rmv('.tasks.'+i);
    }
};
sandbox.tpl_id = 'list';
sandbox.name = 'main';
sandbox.target = document.querySelector('#main');



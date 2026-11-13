sandbox.datas = {
    tag: '',
    tags: [],
    ctrl: () => (event.keyCode == 9 && event.preventDefault(), true),
    add: function() {
        this.tag = this.tag.toUpperCase();
        const s = this.list.find(t => t.slice(0, this.tag.length) == this.tag);
        this.suggest = s ? s : '';
        if (event.keyCode == 9) {
            event.preventDefault();
            this.tag = this.suggest;
            return true;
        }
        if (event.keyCode != 13) return true;
        this.ins('.tags.0', this.tag);
        this.tag = '';
        this.suggest = '';
        return true;
    },
    suggest: '',
    list: [
        '10-A-1',
        '10-B-1_10-C-1',
        '10-D-1_10-E-1',
        '10-F-1',
        '10-G-1',
        '10-H-1',
        '10-I-1',
        '10-J-1',
        '10-K-1',
        '10-L-1',
        '10-M-1',
        '10-M-1_10-M-2',
        '10-M-2',
        '11-A-1',
        '11-B-1',
        '11-C-1',
        '11-D-1',
        '12-A-1',
        '12-B-1',
        '12-C-1',
        '12-D-1',
        '12-E-1',
        '14-C-1',
        '15-A-1',
        '15-B-1',
        '15-C-1',
        '15-D-1',
        '15-E-1',
        '15-F-1',
        '15-G-1',
        '15-H-1',
        '15-I-1',
        '16-A-1',
        '16-A-2',
        '16-B-1',
        '16-B-2',
        '16-C-1',
        '16-C-2',
        '16-D-1',
        '17-A-1',
        '17-A-2',
        '17-C-1',
        '17-D-1',
        '17-E-1',
        '17-F-1',
        '17-G-1',
        '17-H-1',
        '17-I-1',
        '17-J-1',
        '18-IN-1',
        '18-JN-1'
    ]
};
sandbox.preload_tpls = ['tpls/tags.html'];
sandbox.tpl_id = 'tags';
sandbox.name = 'tags';
sandbox.target = document.querySelector('#main');

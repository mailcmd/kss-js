
// Event fired after KSS.init
window.addEventListener('kssready', function(e){
    console.log('kssready event triggered!', e);
});

// Main process
(async function(){
    await KSS.loadtpl('tpls/ws.html'); // first load tpl
    await KSS.include('mods/ws.js');   // then include the module
    KSS.init();
    KSS.connect({
        url: 'http://localhost:8080/websocket?qs=tester',
        reconnect: false
    });
})();
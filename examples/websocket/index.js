
// Event fired after KSS.init
window.addEventListener('kssready', function(e){
    console.log('kssready event triggered!', e);
    KSS.connect({
        url: 'http://localhost:8080/websocket?tester',
        reconnect: false
    });
});

// Main process
(async function(){
    await KSS.loadmod('mods/ws.js');   
    KSS.ready();
})();
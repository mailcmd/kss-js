
// Event fired after KSS.init
window.addEventListener('kssready', function(e){
    console.log('kssready event triggered!', e);
});

// Main process
(async function(){
    await KSS.loadmod('mods/main_sandbox');
    
    await KSS.loadtpl('tpls/sub_sandbox.html');
    
    for (let i = 1; i < 16; i++) {
        await KSS.loadmod('mods/sub_sandbox', {
            name: 'sub'+i,
            color: '#'+i.toString(16).repeat(3)+'000',
            target_id: 'sub'+(i-1)
        });
    }
    KSS.ready();
})();

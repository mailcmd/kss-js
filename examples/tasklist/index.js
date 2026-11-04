
// Event fired after KSS.init
window.addEventListener('kssready', function(e){
    console.log('rfsready event triggered!', e);
});

// Main process
(async function(){
    await KSS.loadtpl('tpls/tasklist.html');
    await KSS.include('mods/tasklist.js');
    KSS.init();
})();
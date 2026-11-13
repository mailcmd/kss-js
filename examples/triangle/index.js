
// Event fired after KSS.init
window.addEventListener('kssready', function(e){
    console.log('kssready event triggered!', e);
});

// Main process
(async function(){
    await KSS.loadmod('mods/triangles');
})();
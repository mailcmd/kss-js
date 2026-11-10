
//console.log(document.currentScript.getAttribute('load'));

// Event fired after KSS.init
window.addEventListener('kssready', function(e){
    console.log('rfsready event triggered!', e);
});

// Main process
(async function(){
    await KSS.loadtpl('tpls/bigtable.html');
    await KSS.include('mods/bigtable.js');
    KSS.init();
})();
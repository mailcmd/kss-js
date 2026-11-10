
// Event fired after KSS.init
window.addEventListener('kssready', function(e){
    console.log('kssready event triggered!', e);
});

// Main process
(async function(){
    await KSS.include('mods/username.js');
    await KSS.include('mods/password.js');
    KSS.getSandbox('username').append_to(document.querySelector('#main'));
    KSS.getSandbox('password').append_to(document.querySelector('#main'));
})();
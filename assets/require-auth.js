/* Simple auth guard for protected pages
   Usage: add in <head> of protected pages:
   <script src="assets/require-auth.js" data-login="login.html" data-project="tyhoonmssqxbtktiuwtd"></script>
   - data-login: path to your login page (default: login.html)
   - data-project: Supabase project ref to infer localStorage key
*/
(function(){
  try{
    var currentScript = document.currentScript || (function(){ var s=document.getElementsByTagName('script'); return s[s.length-1]; })();
    var loginHref = (currentScript && currentScript.getAttribute('data-login')) || 'login.html';
    var projectRef = (currentScript && currentScript.getAttribute('data-project')) || 'tyhoonmssqxbtktiuwtd';
    var key = 'sb-' + projectRef + '-auth-token';
    var raw = null;
    try { raw = localStorage.getItem(key); } catch(_) {}
    if(!raw || raw === 'null' || raw === 'undefined' || (raw.trim && raw.trim()==='')){
      location.replace(loginHref);
      return;
    }
  }catch(_){ /* if anything fails, fallback check will run in app.js */ }
})();


(()=>{function e(e){let t="SHOW_"+e.toUpperCase(),c="show-"+e,d=document.getElementById("show-"+e);function o(){d.checked?document.body.classList.add(c):document.body.classList.remove(c)}d.checked="true"===localStorage.getItem(t),o(),d.addEventListener("change",()=>{localStorage.setItem(t,d.checked),o()})}e("deltas"),e("damage"),e("leagues")})();
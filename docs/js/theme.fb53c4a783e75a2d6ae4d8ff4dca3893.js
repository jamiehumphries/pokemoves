(()=>{let t="THEME",o=["dark","light"];function a(e){localStorage.setItem(t,e),o.forEach(e=>document.body.classList.remove(e)),document.body.classList.add(e)}var e=localStorage.getItem(t);e&&a(e),o.forEach(e=>{document.getElementById(`use-${e}-theme`).addEventListener("click",()=>a(e))})})();
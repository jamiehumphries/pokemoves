!function(){var e=document.querySelectorAll("[data-name]");let t=[...e],n=[...e].reverse();window.addEventListener("keydown",function(e){if(!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)&&("ArrowDown"===e.key&&(e.preventDefault(),function(){for(var e of t){e=e.getBoundingClientRect().top;if(5<e)return window.scrollBy(0,e)}window.scrollTo(0,document.body.scrollHeight)}()),"ArrowUp"===e.key)){e.preventDefault();for(var o of n){o=o.getBoundingClientRect().top;if(o<-5)return void window.scrollBy(0,o)}window.scrollTo(0,0)}})}();
/**
 * Blocking theme init — runs before paint so Light/Dark/System persist without flash.
 * Reads the same storage key as command-centre appearance helpers.
 * Class is applied on <html> because React reconciles <body className> and would wipe body.theme-dark.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var raw=localStorage.getItem("pulse.cc.appearance");var a=raw?JSON.parse(raw):"light";if(a!=="light"&&a!=="dark"&&a!=="system")a="light";var dark=a==="dark"||(a==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var root=document.documentElement;root.classList.toggle("theme-dark",!!dark);root.setAttribute("data-appearance",a);root.style.colorScheme=dark?"dark":"light";}catch(e){}})();`

/**
 * Blocking theme init — runs before paint so Light/Dark/System persist without flash.
 * Reads the same storage key as command-centre appearance helpers.
 * Class is applied on <html> because React reconciles <body className> and would wipe body.theme-dark.
 */
/** Clean-storage default = system (FINAL_DESIGN_SYSTEM_CONTRACT / P1-B1). */
export const THEME_INIT_SCRIPT = `(function(){try{var raw=localStorage.getItem("pulse.cc.appearance");var a=raw?JSON.parse(raw):"system";if(a!=="light"&&a!=="dark"&&a!=="system")a="system";var dark=a==="dark"||(a==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var root=document.documentElement;root.classList.toggle("theme-dark",!!dark);root.setAttribute("data-appearance",a);root.style.colorScheme=dark?"dark":"light";}catch(e){}})();`

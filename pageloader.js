function initPage() {
    document.getElementsByTagName("nav")[0].innerHTML = `
        <div class="navbar">
        <a href="https://eliaschenker.com/physics-simulations">Home</a>
        <div class="dropdown">
            <button class="dropbtn">Newtons's law of universal gravitation 
                <i class="fa fa-caret-down"></i>
            </button>
            <div class="dropdown-content">
                <a href="https://eliaschenker.com/physics-simulations/newtonian_force/MoonAndEarth.html">Moon and earth (Centripetal force)</a>
                <a href="https://eliaschenker.com/physics-simulations/newtonian_force/solarsystem.html">Solar system</a>
                <a href="https://eliaschenker.com/physics-simulations/newtonian_force/gravitationalfield.html">Gravitational Field Visualization</a>
            </div>
        </div>
     `;
}
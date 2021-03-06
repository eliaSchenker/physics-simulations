/**
 * © 2021 Elia Schenker
 */
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
                <a href="https://eliaschenker.com/physics-simulations/newtonian_force/galaxy.html">Galaxy</a>
                <a href="https://eliaschenker.com/project.php?id=nm9t">3-Dimensional simulation of a galaxy</a>
                <a href="https://eliaschenker.com/physics-simulations/newtonian_force/gravitationalfield.html">Gravitational Field Visualization</a>
            </div>
        </div>
        <div class="dropdown">
            <button class="dropbtn">Electrostatics
                <i class="fa fa-caret-down"></i>
            </button>
            <div class="dropdown-content">
                <li><a href="https://eliaschenker.com/physics-simulations/electrostatics/electricfield.html">Electric Field Visualization</a></li>
                <li><a href="https://eliaschenker.com/physics-simulations/electrostatics/electricalcircuit.html">Electrical Circuit Visualization</a></li>
            </div>
        </div>
        <div class="dropdown">
            <button class="dropbtn">Magnetism
                <i class="fa fa-caret-down"></i>
            </button>
            <div class="dropdown-content">
                <li><a href="https://eliaschenker.com/physics-simulations/magnetism/magneticfield.html">Magnetic Field Visualization</a></li>
            </div>
        </div>
        <div class="dropdown">
            <button class="dropbtn">Chaos
                <i class="fa fa-caret-down"></i>
            </button>
            <div class="dropdown-content">
                <li><a href="https://eliaschenker.com/lorentz_attractor">Lorentz attractor</a></li>
            </div>
        </div>
     `;
}
/**
 * © 2021 Elia Schenker
 */
class SIUtil {
    static getMantisse(number) {
        return number.toExponential().split("e")[0];
    }

    static getExponent(number) {
        return number.toExponential().split("e")[1].replace("+", "").replace("-", "");
    }

    static AUtoMeters(astronomicalUnits) {
        return astronomicalUnits * 1.496e+11;
    }

    static metersToAU(meters) {
        return meters / 1.496e+11;
    }

    static solarMassToKg(solarMasses) {
        return solarMasses * 1.98847e30;
    }

    static kgToSolarMasses(kg) {
        return kg / 9.223e18;
    }
}
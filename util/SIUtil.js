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
}
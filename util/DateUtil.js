/**
 * © 2021 Elia Schenker
 */
class DateUtil {
    static secondsToText(seconds) {
        // calculate (and subtract) whole years
        var years = Math.floor(seconds / 3.156e+7);
        seconds -= years * 3.156e+7;

        // calculate (and subtract) whole days
        var days = Math.floor(seconds / 86400);
        seconds -= days * 86400;

        // calculate (and subtract) whole hours
        var hours = Math.floor(seconds / 3600) % 24;
        seconds -= hours * 3600;

        // calculate (and subtract) whole minutes
        var minutes = Math.floor(seconds / 60) % 60;
        seconds -= minutes * 60;

        var yearsText = "";
        if(years != 0) {
            if(years != 1) {
                yearsText = years + " years ";
            }else {
                yearsText = years + " year ";
            }
        }

        var daysText = "";
        if(days != 0) {
            if(days != 1) {
                daysText = days + " days ";
            }else {
                daysText = days + " day ";
            }
        }

        var hoursText = "";
        if(hours != 0) {
            if(hours != 1) {
                hoursText = hours + " hours ";
            }else {
                hoursText = hours + " hour ";
            }
        }

        var minutesText = "";
        if(minutes != 0) {
            if(minutes != 1) {
                minutesText = minutes + " minutes ";
            }else {
                minutesText = minutes + " minute ";
            }
        }

        var secondsText = "";
        if(seconds != 0) {
            if(seconds != 1) {
                secondsText = seconds + " seconds";
            }else {
                secondsText = seconds + " second";
            }
        }

        return yearsText + daysText + hoursText + minutesText + secondsText;
    }
}
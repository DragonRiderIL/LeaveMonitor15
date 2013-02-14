Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}
Date.prototype.addDays = function (d) {
    var month, year, day;
    month = this.getMonth();
    year = this.getFullYear();
    day = this.getDate();
    day = day + d;
    if (day < 1) {
        if (this.getMonth() === 0) {
            month = 11;
            year--;
        }
        else {
            month--;
        }
        if (DateTime.isLeapYear(year)) {
            day = DateTime.monthDaysLeapYear[month] + day;
        }
        else {
            day = DateTime.monthDays[month] + day;
        }
    }
    if (day > DateTime.monthDays[this.getMonth()]) {
        month++;
        day = day - DateTime.monthDays[this.getMonth()];
        if (month > 11) {
            month = 0;
            year++;
        }
    }
    return new Date(year, month, day, 0, 0, 0, 0);
}
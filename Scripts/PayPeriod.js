var PayPeriod = (function () {
    return {
        _seedDate: new Date("01/01/2012"),

        GetCurrentPayPeriod: function (lastSunday) {
            lastSunday = lastSunday.addDays(-lastSunday.getDay());

            if ((LeaveMonitor.daysBetween(lastSunday, PayPeriod._seedDate) % 14) == 0) {
                return lastSunday;
            }
            else {
                return lastSunday.addDays(-7);
            }
        },
        
        GetFutureElapsedPayPeriods: function (futurePayPeriod) {
            return (Math.floor(LeaveMonitor.daysBetween(futurePayPeriod, LeaveMonitor.CurrentPayPeriod) / 14)) + 1;
        },
        
        GetPayPeriodEndDate: function () {
            return LeaveMonitor.CurrentPayPeriod.addDays(13);
        },
        
        GetLastPayPeriodEndDate: function () {
            var myDate = new Date();

            return myDate.setDate(LeaveMonitor.CurrentPayPeriod.addDays(-1));
        },

        SetLastPayPeriodEndDate: function () {
            LeaveMonitor.RecordPayPeriod = (LeaveMonitor.CurrentPayPeriod.addDays(-1));
        },

        ElapsedPayPeriods: function () {
            return Math.floor(LeaveMonitor.daysBetween(LeaveMonitor.CurrentPayPeriod, LeaveMonitor.RecordPayPeriod) / 14);
        },

        SetCurrentPayPeriod: function () {
            LeaveMonitor.CurrentPayPeriod = new Date(PayPeriod.GetCurrentPayPeriod(new Date()));
        }
    };
} ());
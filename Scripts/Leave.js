var Leave = (function () {
    return {
        GetCurrentAnnualLeave: function () {
            return (LeaveMonitor.AnnualBalance + (PayPeriod.ElapsedPayPeriods() * LeaveMonitor.AnnualAccrual) - LeaveMonitor.AnnualExpended);
        },

        GetCurrentSickLeave: function () {
            return (LeaveMonitor.SickBalance + (PayPeriod.ElapsedPayPeriods() * LeaveMonitor.SickAccrual) - LeaveMonitor.SickExpended);
        },

        CheckLeaveDate: function () {
            var leaveDate = new Date($('#LeaveDate').val());
            var leavePayPeriod = new Date(PayPeriod.GetCurrentPayPeriod(leaveDate));
            var numberOfPayPeriods = PayPeriod.GetFutureElapsedPayPeriods(new Date(leavePayPeriod));

            if (numberOfPayPeriods > 0 && leavePayPeriod.getDate() !== LeaveMonitor.CurrentPayPeriod.getDate()) {
                $('#AnticipatedLeave').text((LeaveMonitor.AnnualBalance + (LeaveMonitor.AnnualAccrual * numberOfPayPeriods)).toString());
                $('#AnticipatedSick').text((LeaveMonitor.SickBalance + (LeaveMonitor.SickAccrual * numberOfPayPeriods)).toString());
            }
            else {
                $('#AnticipatedLeave').text(LeaveMonitor.AnnualBalance.toString());
                $('#AnticipatedSick').text(LeaveMonitor.SickBalance.toString());
            }
        },

        IsFutureLeaveScheduled: function () {
            var records = Memory.GetLeaveRecords(),
                eopp = PayPeriod.GetPayPeriodEndDate(),
                recordFound = false;

            $.each(records, function () {
                if (new Date(this['LeaveDate']) > eopp) {
                    recordFound = true;
                    return false;
                };
            });

            return recordFound;
        },

        GetLeaveBufferValues: function () {
            var record,
            futureUsedAnnual = 0,
            futureUsedSick = 0,
            futureUsedComp = 0,
            multiplier = 1,
            records = [];

            records = Memory.GetFutureLeave();

            $.each(records, function () {
                switch (this['TypeLeave']) {
                    case 'Annual':
                        futureUsedAnnual += new Number(this['HoursTaken']);
                        break;
                    case 'Sick':
                        futureUsedSick += new Number(this['HoursTaken']);
                        break;
                    case 'CompTaken':
                        futureUsedComp += new Number(this['HoursTaken']);
                        break;
                };

                if (record) {
                    if (new Date(record['LeaveDate']) < new Date(this['LeaveDate'])) {
                        record = this;
                    };
                }
                else {
                    record = this;
                };
            });

            multiplier = PayPeriod.GetFutureElapsedPayPeriods(
                PayPeriod.GetCurrentPayPeriod(new Date(record['LeaveDate']))
            );

            return {
                FutureAnnual: futureUsedAnnual,
                FutureSick: futureUsedSick,
                FutureComp: futureUsedComp,
                Multiplier: multiplier
            };
        }
    };
} ());
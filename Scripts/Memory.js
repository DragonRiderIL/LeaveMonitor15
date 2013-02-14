var Memory = (function () {
    return {
        _appStore: [],
        _records: [],
        _configuration: [],

        GetConfiguration: function () {
            return JSON.parse(localStorage.LeaveMonitorConfiguration);
        },

        SaveConfiguration: function (configRecords) {
            localStorage.LeaveMonitorConfiguration = JSON.stringify(configRecords);
        },

        GetBaseValue: function (value) {
            if (!Memory._configuration.length) {
                Memory._configuration = JSON.parse(localStorage.LeaveMonitorConfiguration);
            };

            return Memory._configuration[value];
        },

        SaveCompTimeRecord: function (record) {
            var records = [];

            if (localStorage.LeaveMonitorRecords) {
                records = JSON.parse(localStorage.LeaveMonitorRecords);
            };

            records.push(record);

            localStorage.LeaveMonitorRecords = JSON.stringify(records);
        },

        SaveLeaveRecord: function (record) {
            var records = [];

            if (localStorage.LeaveMonitorRecords) {
                records = JSON.parse(localStorage.LeaveMonitorRecords);
            };

            records.push(record);

            localStorage.LeaveMonitorRecords = JSON.stringify(records);
        },

        GetLeaveRecords: function () {
            var records = [];

            if (localStorage.LeaveMonitorRecords) {
                records = JSON.parse(localStorage.LeaveMonitorRecords);
            };

            return records;
        },

        IsConfigured: function () {
            return (localStorage.LeaveMonitorConfiguration);
        },

        LoadMemoryBase: function () {
            if (Memory._appStore.Configuration) {
                Memory._configuration = Memory._appStore.Configuration;
            };

            if (Memory._appStore.Records) {
                Memory._records = Memory._appStore.Records;
            };
        },

        GetFutureLeave: function () {
            var record, records, eopp, futureRecords = [];

            records = Memory.GetLeaveRecords();
            eopp = PayPeriod.GetPayPeriodEndDate();

            $.each(records, function () {
                if (new Date(this['LeaveDate']) > eopp) {
                    futureRecords.push(this);
                };
            });

            return futureRecords;
        },

        Reset: function () {

            localStorage.clear();
            Leave.AnnualExpended = 0;
            Leave.SickExpended = 0;

            Leave.AnnualRecords = [];
            Leave.SickRecords = [];

            Leave.AnnualBuffer = 0;
            Leave.SickBuffer = 0;

            Leave.CompTakeRecords = [];
            Leave.CompExpended = [];

            this.name = null;
            $('input[type="text"]').each(function () {
                $(this).val('');
            });

            Leave.PopulateReportPage();

            $("#tabs").tabs("enable");
            $("#tabs").tabs("option", "active", 3);
            $("#UserNameValue").focus();
            $('#PayPeriodRecordDate').val(Leave.RecordPayPeriod.toDateString());
            console.log('All data reset');
        }
    };
} ());
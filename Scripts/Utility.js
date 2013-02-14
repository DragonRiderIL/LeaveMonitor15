$(document).ready(function () {
    LeaveMonitor.InitializeLeaveMonitor();
});

var LeaveMonitor = (function () {

    return {
        CurrentPayPeriod: new Date(),
        RecordPayPeriod: new Date(),
        AnnualBalance: 0,
        SickBalance: 0,
        AnnualAccrual: 0,
        SickAccrual: 0,
        CompTime: 0,
        UserName: '',
        SickLeave: 0,
        AnnualLeave: 0,
        CompLeave: 0,
        CompExpended: 0,
        AnnualExpended: 0,
        SickExpended: 0,
        AnnualBuffer: 0,
        SickBuffer: 0,
        AnnualRecords: [],
        SickRecords: [],
        CompAddRecords: [],
        CompTakeRecords: [],
        LeaveBalanceExceeded: null,
        AddCompTimeDialog: null,
        HoursMatch: /\d.*\d*/,
        _leaveMarkup: '<tr><td class="ReportColumn">${LeaveDate}</td><td class="ReportColumn">${HoursTaken}</td></tr>',

        InitializeLeaveMonitor: function () {
            LeaveMonitor._setupControls();
            LeaveMonitor._initMemory();
            LeaveMonitor._refreshPageValues();
            LeaveMonitor._configurePage();

        },

        _configurePage: function () {
            LeaveMonitor._configDialogsPickers();
        },

        _setupControls: function () {
            $("#tabs*").tabs();
            $("#LeaveDate").datepicker();
            $('#CompEarnDate').datepicker();
            $('#SaveLeave').click(LeaveMonitor._saveLeave);
            $('#Reset').click(Memory.Reset);
            $('#LeaveDate').change(Leave.CheckLeaveDate);
            $('#LeaveHoursValue').change(LeaveMonitor._validateHourEntry);
            $('#ErrorDisplay').hide();
            $('#AddCompTime').click(LeaveMonitor._addCompTime);
            $('#TakeLeaveTab').click();
            $('SaveSettingsButton').click(LeaveMonitor._saveBaseValues);
        },

        _refreshPageValues: function () {
            LeaveMonitor._tallyLeaveExpended();
            LeaveMonitor._updateLeaveBalancesPage();
            LeaveMonitor._populateReportPage();
            LeaveMonitor._finalPageSettings();
        },

        _finalPageSettings: function () {
            LeaveMonitor._updateBufferValues();
            if (Leave.IsFutureLeaveScheduled()) {
                $('#LeaveBuffers').show();
            }
            else {
                $('#LeaveBuffers').hide();
            };
        },

        _validateHourEntry: function () {
            var hoursField = $('#LeaveHoursValue');
            var errorDisplay = $('#ErrorDisplay');
            var isValid = true;
            var hours = 0;

            if (!LeaveMonitor.HoursMatch.test(hoursField.val())) {
                isValid = false;
                hoursField.addClass('inputError');
                errorDisplay.text('Hour entries must be between 0.25 and 9 hours.');
                errorDisplay.show();
                hoursField.focus();
                return;
            }
            else {
                hours = new Number(hoursField.val());

                if ((hours / .25) !== Math.floor(hours / .25)) {
                    isValid = false;
                    hoursField.addClass('inputError');
                    errorDisplay.text('Leave can only be taken in 1/4 hour increments.');
                    errorDisplay.show();
                    hoursField.focus();
                    return;
                };
            };

            if (isValid) {
                errorDisplay.hide();
                hoursField.removeClass('inputError');
            };
        },

        _addCompTime: function () {
            LeaveMonitor.AddCompTimeDialog.dialog("open");
        },

        _initMemory: function () {
            $.when(PayPeriod.SetCurrentPayPeriod()).then(PayPeriod.SetLastPayPeriodEndDate());

            if (!Memory.IsConfigured()) {
                console.log('Not yet configured, getting base settings');
                $("#tabs").tabs("option", "active", 3);
                $("#UserNameValue").focus();
                $('#PayPeriodRecordDate').val(LeaveMonitor.RecordPayPeriod.toDateString());
            } else {
                console.log('Configured, setting up forms');
                $("#tabs").tabs("option", "disabled", [3]);
                LeaveMonitor._getBaseValues();
            }
        },

        _configDialogsPickers: function () {
            var minDate = new Date(LeaveMonitor.RecordPayPeriod);
            minDate.setDate(minDate.getDate() + 1);
            $("#LeaveDate").datepicker('option', 'minDate', new Date(minDate.toDateString()));
            $('#CompEarnDate').datepicker('option', 'minDate', new Date(minDate.toDateString()));
            $('#CompTimeBalanceDisplay').val(LeaveMonitor.CompLeave - LeaveMonitor.CompExpended);
            LeaveMonitor.LeaveBalanceExceeded = $('#LeaveBalanceExceededDialog');
            LeaveMonitor.LeaveBalanceExceeded.dialog({
                autoOpen: false,
                modal: true,
                resizable: false,
                title: 'Available leave exceeded',
                buttons: {
                    Ok: function () {
                        $(this).dialog("close");
                        $('#LeaveHoursValue').focus();
                    }
                }
            });
            LeaveMonitor.AddCompTimeDialog = $('#CompTimeDialog');
            LeaveMonitor.AddCompTimeDialog.dialog({
                autoOpen: false,
                modal: true,
                resizable: false,
                title: 'Add Comp Time',
                buttons: {
                    Save: function () {
                        $(this).dialog("close");
                        LeaveMonitor._saveCompHours();
                    },
                    Cancel: function () {
                        $(this).dialog("close");
                    }
                }
            });
        },

        _saveCompHours: function () {
            Memory.SaveCompTimeRecord(
            {
                LeaveDate: $('#CompEarnDate').val(),
                TypeLeave: 'CompAdd',
                HoursTaken: $('#CompEarned').val()
            });

            $('#CompEarnDate').val('');
            $('#CompEarned').val('');
            LeaveMonitor._refreshPageValues();
        },

        _populateReportPage: function () {
            $('#AnnualLeaveTable > tbody').empty();
            $('#SickLeaveTable > tbody').empty();
            $('#CompEarnTable > tbody').empty();
            $('#CompTakeTable > tbody').empty();
            $.template('RecordsMarkup', LeaveMonitor._leaveMarkup);
            $.tmpl('RecordsMarkup', LeaveMonitor.AnnualRecords).appendTo($('#AnnualLeaveTable'));
            $.tmpl('RecordsMarkup', LeaveMonitor.SickRecords).appendTo($('#SickLeaveTable'));
            $.tmpl('RecordsMarkup', LeaveMonitor.CompAddRecords).appendTo($('#CompEarnTable'));
            $.tmpl('RecordsMarkup', LeaveMonitor.CompTakeRecords).appendTo($('#CompTakeTable'));
            //$('table#NsnTable tr:even').css('background-color', '#DBE2E2').css('border-color', '#DBE2E2');
            $('table#AnnualLeaveTable tr:even').css('background-color', '#8AB8E6').css('border-color', '#8AB8E6');
            $('table#SickLeaveTable tr:even').css('background-color', '#8AB8E6').css('border-color', '#8AB8E6');
            $('table#CompEarnTable tr:even').css('background-color', '#8AB8E6').css('border-color', '#8AB8E6');
            $('table#CompTakeTable tr:even').css('background-color', '#8AB8E6').css('border-color', '#8AB8E6');
        },

        _getBaseValues: function () {
            console.log('Getting localStorage values...');
            LeaveMonitor.AnnualAccrual = new Number(Memory.GetBaseValue("AnnualAccrual"));
            LeaveMonitor.AnnualBalance = new Number(Memory.GetBaseValue("AnnualBalance"));
            LeaveMonitor.SickBalance = new Number(Memory.GetBaseValue("SickBalance"));
            LeaveMonitor.SickAccrual = new Number(Memory.GetBaseValue("SickAccrual"));
            LeaveMonitor.CompTime = new Number(Memory.GetBaseValue("CompTime"));
            LeaveMonitor.UserName = Memory.GetBaseValue("UserName");
            LeaveMonitor.RecordPayPeriod = new Date(Memory.GetBaseValue("RecordPayPeriod"));
        },

        _updateLeaveBalancesPage: function () {
            $('#AnnualBalanceDisplay').val(Leave.GetCurrentAnnualLeave().toString());
            $('#SickLeaveBalanceDisplay').val(Leave.GetCurrentSickLeave().toString());
            $('#UserName').text(LeaveMonitor.UserName);
            $('#UserNameValue').val(LeaveMonitor.UserName);
            $('#CurrentPayPeriodDisplay').val(LeaveMonitor.CurrentPayPeriod.toDateString());
            $('#PayPeriodRecordDate').val(LeaveMonitor.RecordPayPeriod.toDateString());
            $('#CompTimeBalanceDisplay').val((LeaveMonitor.CompLeave - LeaveMonitor.CompExpended).toString());
        },

        _tallyLeaveExpended: function () {
            var hours, eopp, recordDate, leaveRecords;

            LeaveMonitor.AnnualExpended = 0;
            LeaveMonitor.SickExpended = 0;
            LeaveMonitor.CompLeave = 0;
            LeaveMonitor.CompExpended = 0;

            LeaveMonitor.AnnualRecords = [];
            LeaveMonitor.SickRecords = [];
            LeaveMonitor.CompAddRecords = [];
            LeaveMonitor.CompTakeRecords = [];

            leaveRecords = Memory.GetLeaveRecords();

            $(leaveRecords).each(function () {
                hours = new Number(this['HoursTaken']);
                eopp = PayPeriod.GetPayPeriodEndDate();
                recordDate = new Date(this['LeaveDate']);
                switch (this['TypeLeave']) {
                    case 'Annual':
                        if (recordDate > eopp) {
                            LeaveMonitor.AnnualBuffer -= hours;
                        }
                        else {
                            if (recordDate <= eopp) {
                                LeaveMonitor.AnnualExpended += hours;
                            };

                            LeaveMonitor.AnnualRecords.push(this);
                        };
                        break;
                    case 'Sick':
                        if (recordDate > eopp) {
                            LeaveMonitor.SickBuffer -= hours;
                        }
                        else {
                            if (recordDate <= eopp) {
                                LeaveMonitor.SickExpended += hours;
                            };
                            LeaveMonitor.SickRecords.push(this);
                        }
                        break;
                    case 'CompAdd':
                        LeaveMonitor.CompAddRecords.push(this);
                        LeaveMonitor.CompLeave += hours;
                        break;
                    case 'CompTake':
                        if (recordDate <= eopp) {
                            LeaveMonitor.CompExpended += hours;
                        };
                        LeaveMonitor.CompTakeRecords.push(this);
                        break;
                };

            });
        },

        LeaveEntryError: function (record) {
            var endOfPP = PayPeriod.GetPayPeriodEndDate();

            if (record["HoursTaken"] > 0 && record["LeaveDate"] <= endOfPP) {
                switch (leaveType) {
                    case 'Annual':
                        if (record["HoursTaken"] > Leave.AnnualBalance) {
                            return true;
                        };
                        break;
                    case 'Sick':
                        if (record["HoursTaken"] > Leave.SickBalance) {
                            return true;
                        };
                        break;
                };
            };
            return false;
        },

        _updateBufferValues: function (leaveDate, leaveType, hours) {
            var values = Leave.GetLeaveBufferValues();

            LeaveMonitor.AnnualBuffer = (
                LeaveMonitor.AnnualBalance + (LeaveMonitor.AnnualAccrual * new Number(values['Multiplier']))
                ) - new Number(values['FutureAnnual']);

            LeaveMonitor.SickBuffer = (
                LeaveMonitor.SickBalance + (LeaveMonitor.SickAccrual * new Number(values['Multiplier']))
                ) - new Number(values['FutureSick']);

            $('#AnnualBufferValue').text(LeaveMonitor.AnnualBuffer.toString());
            $('#SickBufferValue').text(LeaveMonitor.SickBuffer.toString());
        },

        _saveLeave: function () {
            var record =
            {
                LeaveDate: $('#LeaveDate').val(),
                TypeLeave: $('input:checked').attr('id'),
                HoursTaken: $('#LeaveHoursValue').val()
            };

            if (LeaveMonitor.LeaveEntryError(record)) {
                LeaveMonitor.LeaveBalanceExceeded.dialog("open");
            }
            else {
                Memory.SaveLeaveRecord(record);

                if (record["leaveDate"] > PayPeriod.GetPayPeriodEndDate()) {
                    LeaveMonitor.UpdateBufferValues(record["leaveDate"], record["leaveType"], record["hours"]);
                };

                $('#LeaveDate').val(new Date().toDateString());
                $('#LeaveHoursValue').val('');

                LeaveMonitor._updateBufferValues();
                LeaveMonitor._refreshPageValues();
                $("#tabs").tabs("option", "active", 0);
            };
        },

        _saveBaseValues: function () {
            Memory.SaveConfiguration({
                UserName: $('#UserNameValue').val(),
                AnnualBalance: $('#AnnualBalance').val(),
                SickBalance: $('#SickBalance').val(),
                AnnualAccrual: $('#AnnualAccrual').val(),
                SickAccrual: $('#SickAccrual').val(),
                CompTime: '',
                RecordPayPeriod: $('#PayPeriodRecordDate').val()
            });

            LeaveMonitor_getBaseValues();
            LeaveMonitor._refreshPageValues();

            $("#tabs").tabs("option", "active", 0);
            $("#tabs").tabs("option", "disabled", [3]);
        },

        ToggleLeaveRadioButtons: function (itemSelected) {
            switch (itemSelected) {
                case "Annual":
                    $("#Sick").prop("checked", false);
                    $("#CompTake").prop("checked", false);
                    $("#Annual").prop("checked", true);
                    break;
                case "Sick":
                    $("#Sick").prop("checked", true);
                    $("#Annual").prop("checked", false);
                    $("#CompTake").prop("checked", false);
                    break;
                case "CompTake":
                    $("#Sick").prop("checked", false);
                    $("#Annual").prop("checked", false);
                    $("#CompTake").prop("checked", true);
                    break;
            }
        },

        daysBetween: function (date1, date2) {
            // adjust diff for for daylight savings
            var hoursToAdjust = Math.floor(date1.getTimezoneOffset() / 60) - Math.floor(date2.getTimezoneOffset() / 60);
            // apply the tz offset
            date2.addHours(hoursToAdjust);

            // The number of milliseconds in one day
            var ONE_DAY = 1000 * 60 * 60 * 24

            // Convert both dates to milliseconds
            var date1_ms = date1.getTime()
            var date2_ms = date2.getTime()

            // Calculate the difference in milliseconds
            var difference_ms = Math.abs(date1_ms - date2_ms)

            // Convert back to days and return
            return Math.floor(difference_ms / ONE_DAY)
        }
    };
} ());
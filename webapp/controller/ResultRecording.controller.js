sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("com.kaar.quality.controller.ResultRecording", {

        onInit: function () {
            // Initialize view model
            var oViewModel = new JSONModel({
                lot: {},
                resultRecord: {
                    unrestrictedStock: 0,
                    blockStock: 0,
                    productionStock: 0,
                    totalInspected: 0
                },
                isReadOnly: false
            });
            this.getView().setModel(oViewModel);

            // Get router and attach route matched
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("ResultRecording").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sLotId = oEvent.getParameter("arguments").lotId;
            this._loadLotData(sLotId);
        },

        _loadLotData: function (sLotId) {
            var oView = this.getView();
            var oDataModel = this.getOwnerComponent().getModel("inspection");

            oView.setBusy(true);

            // Read specific lot
            var sPath = "/ZINSPECTION_2003('" + sLotId + "')";

            oDataModel.read(sPath, {
                success: function (oData) {
                    oView.setBusy(false);

                    var oViewModel = oView.getModel();
                    oViewModel.setProperty("/lot", oData);

                    // Check if usage decision is taken
                    var bIsReadOnly = oData.UDType && oData.UDType !== "";
                    oViewModel.setProperty("/isReadOnly", bIsReadOnly);

                    // Load existing result records if any
                    this._loadResultRecords(sLotId);
                }.bind(this),
                error: function (oError) {
                    oView.setBusy(false);
                    MessageBox.error("Error loading lot data");
                    console.error("Error loading lot data:", oError);
                }.bind(this)
            });
        },

        _loadResultRecords: function (sLotId) {
            // In a real scenario, this would load from a separate result records entity
            // For now, we'll use local storage to simulate progressive save
            var sStorageKey = "resultRecord_" + sLotId;
            var sStoredData = localStorage.getItem(sStorageKey);

            if (sStoredData) {
                var oResultRecord = JSON.parse(sStoredData);
                var oViewModel = this.getView().getModel();
                oViewModel.setProperty("/resultRecord", oResultRecord);

                MessageToast.show("Previous results loaded");
            }
        },

        onQuantityChange: function () {
            var oViewModel = this.getView().getModel();
            var oResultRecord = oViewModel.getProperty("/resultRecord");

            // Calculate total inspected
            var iUnrestricted = parseFloat(oResultRecord.unrestrictedStock) || 0;
            var iBlock = parseFloat(oResultRecord.blockStock) || 0;
            var iProduction = parseFloat(oResultRecord.productionStock) || 0;

            var iTotal = iUnrestricted + iBlock + iProduction;
            oViewModel.setProperty("/resultRecord/totalInspected", iTotal);
        },

        onSave: function () {
            var oViewModel = this.getView().getModel();
            var oResultRecord = oViewModel.getProperty("/resultRecord");
            var oLot = oViewModel.getProperty("/lot");

            // Validate inputs
            if (oResultRecord.unrestrictedStock < 0 || oResultRecord.blockStock < 0 || oResultRecord.productionStock < 0) {
                MessageBox.error("Quantities cannot be negative");
                return;
            }

            // Save to local storage (simulating backend save)
            var sStorageKey = "resultRecord_" + oLot.InspectionLot;
            localStorage.setItem(sStorageKey, JSON.stringify(oResultRecord));

            MessageToast.show("Results saved successfully");
        },

        onMakeDecision: function () {
            var oViewModel = this.getView().getModel();
            var oLot = oViewModel.getProperty("/lot");

            // Navigate to Usage Decision view
            this.getOwnerComponent().getRouter().navTo("UsageDecision", {
                lotId: oLot.InspectionLot
            });
        },

        formatUsageDecision: function (sCode) {
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            switch (sCode) {
                case "A":
                    return oResourceBundle.getText("approved");
                case "R":
                case "R2":
                    return oResourceBundle.getText("rejected");
                case "PENDING":
                    return oResourceBundle.getText("pending");
                default:
                    return oResourceBundle.getText("pending");
            }
        },

        formatUsageDecisionState: function (sCode) {
            switch (sCode) {
                case "A":
                    return "Success";
                case "R":
                case "R2":
                    return "Error";
                case "PENDING":
                    return "Warning";
                default:
                    return "None";
            }
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("InspectionLotList");
        }
    });
});

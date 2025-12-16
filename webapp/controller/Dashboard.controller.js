sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("com.kaar.quality.controller.Dashboard", {

        onInit: function () {
            // Initialize dashboard model
            var oDashboardModel = new JSONModel({
                inspectionLotCount: 0,
                resultRecordsCount: 0,
                usageDecisionCount: 0
            });
            this.getView().setModel(oDashboardModel);

            // Load inspection data
            this._loadInspectionData();
        },

        _loadInspectionData: function () {
            var oView = this.getView();
            var oDataModel = this.getOwnerComponent().getModel("inspection");

            oView.setBusy(true);

            // Read inspection lots
            oDataModel.read("/ZINSPECTION_2003", {
                success: function (oData) {
                    oView.setBusy(false);

                    if (oData && oData.results) {
                        var aInspectionLots = oData.results;

                        // Calculate counts
                        var iTotalLots = aInspectionLots.length;

                        // Result Records: Lots without usage decision (UDType is empty)
                        var iPendingRecords = aInspectionLots.filter(function (lot) {
                            return !lot.UDType || lot.UDType === "";
                        }).length;

                        // Usage Decision: Lots ready for decision (fully inspected)
                        // For now, showing lots with pending status
                        var iPendingDecisions = aInspectionLots.filter(function (lot) {
                            return lot.UsageDecisionCode === "PENDING";
                        }).length;

                        // Update model
                        var oDashboardModel = oView.getModel();
                        oDashboardModel.setProperty("/inspectionLotCount", iTotalLots);
                        oDashboardModel.setProperty("/resultRecordsCount", iPendingRecords);
                        oDashboardModel.setProperty("/usageDecisionCount", iPendingDecisions);

                        // Store inspection data for navigation
                        var oInspectionModel = new JSONModel(aInspectionLots);
                        this.getOwnerComponent().setModel(oInspectionModel, "inspectionData");
                    }
                }.bind(this),
                error: function (oError) {
                    oView.setBusy(false);
                    MessageToast.show("Error loading inspection data");
                    console.error("Error loading inspection data:", oError);
                }.bind(this)
            });
        },

        onNavigateToInspectionLots: function () {
            this.getOwnerComponent().getRouter().navTo("InspectionLotList");
        },

        onNavigateToResultRecords: function () {
            // Navigate to inspection lot list filtered for pending records
            this.getOwnerComponent().getRouter().navTo("InspectionLotList", {
                filter: "pending"
            });
        },

        onNavigateToUsageDecision: function () {
            // Navigate to inspection lot list filtered for pending decisions
            this.getOwnerComponent().getRouter().navTo("InspectionLotList", {
                filter: "decision"
            });
        },

        onLogout: function () {
            // Clear user session
            this.getOwnerComponent().setModel(null, "user");

            // Navigate to login
            this.getOwnerComponent().getRouter().navTo("Login");

            MessageToast.show("Logged out successfully");
        }
    });
});

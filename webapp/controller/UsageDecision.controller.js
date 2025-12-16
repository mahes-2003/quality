sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("com.kaar.quality.controller.UsageDecision", {

        onInit: function () {
            // Initialize view model
            var oViewModel = new JSONModel({
                lot: {},
                resultRecord: {
                    unrestrictedStock: 0,
                    blockStock: 0,
                    productionStock: 0,
                    totalInspected: 0
                }
            });
            this.getView().setModel(oViewModel);

            // Get router and attach route matched
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("UsageDecision").attachPatternMatched(this._onRouteMatched, this);
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

                    // Load result records
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
            // Load from local storage
            var sStorageKey = "resultRecord_" + sLotId;
            var sStoredData = localStorage.getItem(sStorageKey);

            if (sStoredData) {
                var oResultRecord = JSON.parse(sStoredData);
                var oViewModel = this.getView().getModel();
                oViewModel.setProperty("/resultRecord", oResultRecord);
            } else {
                MessageBox.warning("No result records found for this lot. Please record results first.");
            }
        },

        onApprove: function () {
            var oViewModel = this.getView().getModel();
            var oLot = oViewModel.getProperty("/lot");
            var oResultRecord = oViewModel.getProperty("/resultRecord");

            // Validate quantities match
            if (oResultRecord.totalInspected !== oLot.LotQuantity) {
                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("quantityMismatchError"));
                return;
            }

            // Confirm approval
            MessageBox.confirm(
                "Are you sure you want to approve this inspection lot?",
                {
                    title: "Confirm Approval",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            this._submitDecision(oLot.InspectionLot, "A");
                        }
                    }.bind(this)
                }
            );
        },

        onReject: function () {
            var oViewModel = this.getView().getModel();
            var oLot = oViewModel.getProperty("/lot");
            var oResultRecord = oViewModel.getProperty("/resultRecord");

            // Validate quantities match
            if (oResultRecord.totalInspected !== oLot.LotQuantity) {
                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("quantityMismatchError"));
                return;
            }

            // Confirm rejection
            MessageBox.confirm(
                "Are you sure you want to reject this inspection lot?",
                {
                    title: "Confirm Rejection",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            this._submitDecision(oLot.InspectionLot, "R");
                        }
                    }.bind(this)
                }
            );
        },

        _submitDecision: function (sLotId, sDecisionCode) {
            var oView = this.getView();

            // In a real scenario, this would update the backend via OData
            // For now, we'll simulate the update
            oView.setBusy(true);

            // Simulate backend call
            setTimeout(function () {
                oView.setBusy(false);

                var sDecisionText = sDecisionCode === "A" ? "Approved" : "Rejected";
                MessageBox.success("Usage decision '" + sDecisionText + "' has been recorded successfully.", {
                    onClose: function () {
                        // Clear result records from storage
                        var sStorageKey = "resultRecord_" + sLotId;
                        localStorage.removeItem(sStorageKey);

                        // Navigate back to dashboard
                        this.getOwnerComponent().getRouter().navTo("Dashboard");
                    }.bind(this)
                });
            }.bind(this), 1000);
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("ResultRecording", {
                lotId: this.getView().getModel().getProperty("/lot/InspectionLot")
            });
        }
    });
});

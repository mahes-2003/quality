sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("com.kaar.quality.controller.InspectionLotList", {

        onInit: function () {
            // Initialize view model
            var oViewModel = new JSONModel({
                inspectionLots: [],
                selectedLot: null
            });
            this.getView().setModel(oViewModel);

            // Get router and attach route matched
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("InspectionLotList").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sFilter = oEvent.getParameter("arguments").filter;
            this._loadInspectionLots(sFilter);
        },

        _loadInspectionLots: function (sFilter) {
            var oView = this.getView();
            var oDataModel = this.getOwnerComponent().getModel("inspection");

            oView.setBusy(true);

            oDataModel.read("/ZINSPECTION_2003", {
                success: function (oData) {
                    oView.setBusy(false);

                    if (oData && oData.results) {
                        var aLots = oData.results;

                        // Apply filter if specified
                        if (sFilter === "pending") {
                            // Filter for pending result records (no usage decision)
                            aLots = aLots.filter(function (lot) {
                                return !lot.UDType || lot.UDType === "";
                            });
                        } else if (sFilter === "decision") {
                            // Filter for pending decisions
                            aLots = aLots.filter(function (lot) {
                                return lot.UsageDecisionCode === "PENDING";
                            });
                        }

                        oView.getModel().setProperty("/inspectionLots", aLots);
                    }
                }.bind(this),
                error: function (oError) {
                    oView.setBusy(false);
                    console.error("Error loading inspection lots:", oError);
                }.bind(this)
            });
        },

        onLotSelect: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem");
            var oContext = oSelectedItem.getBindingContext();
            var oLot = oContext.getObject();

            this.getView().getModel().setProperty("/selectedLot", oLot);
        },

        onRecordResults: function () {
            var oSelectedLot = this.getView().getModel().getProperty("/selectedLot");

            if (oSelectedLot) {
                // Navigate to Result Recording view
                this.getOwnerComponent().getRouter().navTo("ResultRecording", {
                    lotId: oSelectedLot.InspectionLot
                });
            }
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("inspectionLotTable");
            var oBinding = oTable.getBinding("items");

            var aFilters = [];
            if (sQuery) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("InspectionLot", FilterOperator.Contains, sQuery),
                        new Filter("MaterialNumber", FilterOperator.Contains, sQuery),
                        new Filter("MaterialDesc", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }

            oBinding.filter(aFilters);
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
            this.getOwnerComponent().getRouter().navTo("Dashboard");
        }
    });
});

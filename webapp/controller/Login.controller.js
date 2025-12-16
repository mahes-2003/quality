sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageBox) {
    "use strict";

    return Controller.extend("com.kaar.quality.controller.Login", {

        onInit: function () {
            // Initialize login model
            var oLoginModel = new JSONModel({
                username: "",
                password: "",
                errorMessage: "",
                showError: false
            });
            this.getView().setModel(oLoginModel);
        },

        onLogin: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var sUsername = oModel.getProperty("/username");
            var sPassword = oModel.getProperty("/password");

            // Reset error state
            oModel.setProperty("/showError", false);
            oModel.setProperty("/errorMessage", "");

            console.log("Login attempt:", { username: sUsername, password: sPassword });

            // Validate inputs
            if (!sUsername || !sPassword) {
                console.log("Validation failed: Empty username or password");
                oModel.setProperty("/errorMessage", this.getView().getModel("i18n").getResourceBundle().getText("loginErrorEmpty"));
                oModel.setProperty("/showError", true);
                return;
            }

            // Show busy indicator
            oView.setBusy(true);

            // Get OData model
            var oDataModel = this.getOwnerComponent().getModel();

            // Call authentication service - using the correct format from the response
            var sPath = "/ZQUALITY_2003(username='" + sUsername + "')";
            console.log("Reading OData path:", sPath);

            oDataModel.read(sPath, {
                success: function (oData) {
                    console.log("OData read success. Data received:", oData);
                    oView.setBusy(false);

                    // Check if password matches
                    // Log the full data object to be sure
                    console.log("Full OData response:", JSON.stringify(oData));

                    if (oData.password === sPassword && oData.login_status === "Success") {
                        console.log("Credentials match. Navigating to Dashboard...");
                        MessageBox.success("Login Successful! Navigating...");

                        // Store user info in session
                        var oUserModel = new JSONModel({
                            username: oData.username,
                            isAuthenticated: true
                        });
                        this.getOwnerComponent().setModel(oUserModel, "user");

                        // Navigate to Dashboard
                        try {
                            this.getOwnerComponent().getRouter().navTo("Dashboard");
                            console.log("Navigation triggered.");
                        } catch (e) {
                            console.error("Navigation error:", e);
                            MessageBox.error("Navigation failed: " + e.message);
                        }
                    } else {
                        console.warn("Credentials mismatch or login_status not Success.", {
                            receivedPassword: oData.password,
                            expectedPassword: sPassword,
                            status: oData.login_status
                        });

                        MessageBox.error("Login Failed: Password or status mismatch.\nReceived: " + oData.password + ", " + oData.login_status);

                        // Invalid credentials
                        oModel.setProperty("/errorMessage", this.getView().getModel("i18n").getResourceBundle().getText("loginErrorInvalid"));
                        oModel.setProperty("/showError", true);
                    }
                }.bind(this),
                error: function (oError) {
                    console.error("OData read failed:", oError);
                    oView.setBusy(false);

                    // User not found or service error
                    var sErrorMsg = "Login failed. Please check console for details.";
                    try {
                        if (oError.responseText) {
                            console.error("Error response text:", oError.responseText);
                            // Optional: Try to parse error text if it's JSON
                        }
                    } catch (e) { /* ignore */ }

                    oModel.setProperty("/errorMessage", this.getView().getModel("i18n").getResourceBundle().getText("loginErrorInvalid"));
                    oModel.setProperty("/showError", true);
                    MessageBox.error("Service Error: " + oError.message || "Unknown error during login.");
                }.bind(this)
            });
        }
    });
});

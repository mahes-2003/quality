/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["com/kaar/quality/test/integration/AllJourneys"
], function () {
	QUnit.start();
});

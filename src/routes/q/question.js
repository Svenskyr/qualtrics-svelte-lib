// @ts-nocheck
/// <reference types="vite/client" />

Qualtrics.SurveyEngine.addOnload(function () {
	/* Place your JavaScript here to run when the page loads */
});

Qualtrics.SurveyEngine.addOnReady(function () {
	/* Choice 1 ("Very satisfied") is correct for this mock. */
	svlib.enableComprehensionQuestion(this, [1]);
});

Qualtrics.SurveyEngine.addOnUnload(function () {
	/* Place your JavaScript here to run when the page is unloaded */
});

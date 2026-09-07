/**
 * Qualtrics IIFE entry — functions exported here become `window.svlib.*`.
 * Keep this entry free of `.svelte` imports so the Qualtrics bundle does not
 * ship the Svelte runtime (header scripts are size- and scope-sensitive).
 */
import './qualtrics/MultipleChoiceQuestion/v2/comprehension.css';
import {
	disableComprehensionQuestion,
	disableMultipleChoiceQuestion,
	enableComprehensionQuestion,
	enableMultipleChoiceQuestion,
} from './qualtrics/MultipleChoiceQuestion/v2/enable.js';
import { NextButtonManager } from './qualtrics/next-button-manager.js';
import { publishSvlibGlobal } from './qualtrics/publish-global.js';

const api = {
	enableMultipleChoiceQuestion,
	disableMultipleChoiceQuestion,
	enableComprehensionQuestion,
	disableComprehensionQuestion,
	NextButtonManager,
};

publishSvlibGlobal(api as Window['svlib']);

console.info('[svlib] loaded');

export {
	enableMultipleChoiceQuestion,
	disableMultipleChoiceQuestion,
	enableComprehensionQuestion,
	disableComprehensionQuestion,
	NextButtonManager,
};

# Qualtrics JavaScript Question API Class

> Source: Qualtrics API docs (snapshot). Original: https://api.qualtrics.com/82bd4d5c331f1-qualtrics-java-script-question-api-class

## Table of Contents

- [Overview](#overview)
- [Major New Survey Taking Experience Differences](#major-new-survey-taking-experience-differences)
- [Qualtrics.SurveyEngine Methods](#qualtricssurveyengine-methods)
  - [addEmbeddedData ( key  value )](#addembeddeddata-key-value-)
  - [addOnload ( f )](#addonload-f-)
  - [addOnReady ( f )](#addonready-f-)
  - [addOnPageSubmit ( f )](#addonpagesubmit-f-)
  - [addOnUnload ( f )](#addonunload-f-)
  - [Qualtrics.SurveyEngine.QuestionData.getInstance(questionId string)](#qualtricssurveyenginequestiondatagetinstancequestionid-string)
  - [getJSEmbeddedData(key)](#getjsembeddeddatakey)
  - [setEmbeddedData ( key  value )](#setembeddeddata-key-value-)
  - [setJSEmbeddedData(key, value)](#setjsembeddeddatakey-value)
- [Question Methods (this in addOnload callbacks)](#question-methods-this-in-addonload-callbacks)
  - [addOnClick ()](#addonclick-)
  - [clickNextButton ()](#clicknextbutton-)
  - [clickPreviousButton ()](#clickpreviousbutton-)
  - [disableNextButton ()](#disablenextbutton-)
  - [disablePreviousButton ()](#disablepreviousbutton-)
  - [enableNextButton ()](#enablenextbutton-)
  - [enablePreviousButton ()](#enablepreviousbutton-)
  - [getAnswers () Array](#getanswers-array)
  - [getChoiceAnswerValue ( choiceId  answerId  subId ) (String)](#getchoiceanswervalue-choiceid-answerid-subid-string)
  - [getChoiceContainer ()](#getchoicecontainer-)
  - [getChoiceDisplayed ( choiceId  answerId  subId ) (Boolean)](#getchoicedisplayed-choiceid-answerid-subid-boolean)
  - [getChoiceRecodeValue ( choiceId )](#getchoicerecodevalue-choiceid-)
  - [getChoices () Array](#getchoices-array)
  - [getChoicesFromRecodeValue ( recodeVal ) (Array)](#getchoicesfromrecodevalue-recodeval-array)
  - [getChoicesFromVariableName ( varName ) (Array)](#getchoicesfromvariablename-varname-array)
  - [getChoiceValue ( choiceId  [subId] ) (String)](#getchoicevalue-choiceid-subid-string)
  - [getChoiceVariableName ( choiceId )](#getchoicevariablename-choiceid-)
  - [getPostTag () (String | null)](#getposttag-string-null)
  - [getQuestionContainer ()](#getquestioncontainer-)
  - [getQuestionDisplayed () (Boolean)](#getquestiondisplayed-boolean)
  - [getQuestionInfo () (Object | null)](#getquestioninfo-object-null)
  - [getQuestionTextContainer ()](#getquestiontextcontainer-)
  - [getSelectedAnswers ()](#getselectedanswers-)
  - [getSelectedAnswerValue ( choiceId )](#getselectedanswervalue-choiceid-)
  - [getSelectedChoices ()](#getselectedchoices-)
  - [getTextValue ( [opt_choiceId] )](#gettextvalue-opt_choiceid-)
  - [hideChoices ()](#hidechoices-)
  - [hideNextButton ()](#hidenextbutton-)
  - [hidePreviousButton ()](#hidepreviousbutton-)
  - [setChoiceAnswerValue ( choiceId  answerId  value )](#setchoiceanswervalue-choiceid-answerid-value-)
  - [setChoiceValue ( choiceId  [subId]  value )](#setchoicevalue-choiceid-subid-value-)
  - [setChoiceValueByRecodeValue ( recodeValue  [subId]  value )](#setchoicevaluebyrecodevalue-recodevalue-subid-value-)
  - [setChoiceValueByVariableName ( variableName  [subId]  value )](#setchoicevaluebyvariablename-variablename-subid-value-)
  - [showNextButton ()](#shownextbutton-)
  - [showPreviousButton ()](#showpreviousbutton-)
- [Properties](#properties)
  - [Qualtrics.SurveyEngine.QuestionInfo](#qualtricssurveyenginequestioninfo)
  - [questionclick](#questionclick)
  - [questionContainer](#questioncontainer)
  - [questionId](#questionid)

## Overview

The Qualtrics Question API allows users to interact with a question in a survey using JavaScript. Note that interaction with questions is not limited to the functions available in the API. The API simply abstracts the most used functionality to a set of methods called on the question object.

All functions using the API must be wrapped in a `Qualtrics.SurveyEngine.addOnload` function. The `addOnload` function automatically instantiates the Question Data class and binds the instantiated object to allow its functions and properties to be accessed using the this keyword directly.

```javascript
//create Qualtrics.SurveyEngine.QuestionData object
Qualtrics.SurveyEngine.addOnload(function ()
{
    //disables the next button on the page
    this.disableNextButton();
    //question click is a simple onclick handler
    //attached to the question's container div
    this.questionclick = function(event,element)
    {
        //by default you get the click event as the first parameter and the clicked element as the second parameter
        console.log(event, element);
        if (element.type == 'radio')
        {
            var choiceNum = element.id.split('~')[2];
            alert('You clicked on choice '+choiceNum);
            if (choiceNum == 2)
            {
                //enables the next button - Note that the QuestionData object is bound to this to make it easier to use
                this.enableNextButton();
            }
            else
            {
                //disables the next button
                this.disableNextButton();
            }
        }
    }
});
```

The table of [methods](#methods) below lists predefined functions and properties that can be used on the `Qualtrics.SurveyEngine.QuestionData` class. Note that the `addOnload` function on the `Qualtrics.SurveyEngine` object automatically instantiates the `QuestionData` class and binds the instantiated object to allow these functions to be called using this directly.

## Major New Survey Taking Experience Differences

The New Survey Taking Experience has several key differences in both its core structure and details of the Question API:

Most notably, the DOM has been updated to better support accessibility and the mobile experience. Because of this the CSS selectors for survey elements will be different. To learn more, see the [Add Custom CSS](https://www.qualtrics.com/support/survey-platform/survey-module/look-feel/fonts-and-colors/#AddCustomCSS) section from our guide on [Survey Style & Motion](https://www.qualtrics.com/support/survey-platform/survey-module/look-feel/fonts-and-colors/).

On older layouts, the SurveyEngine would also automatically import jquery. This is no longer the case with the New Survey Taking Experience, but jquery can still be imported by survey designers manually by adding a `<script>` tag in your survey's header.

## Qualtrics.SurveyEngine Methods

### addEmbeddedData ( key  value )

Adds embedded data to the page

**Parameters:**

- `key` (String): the embedded data key
- `value` (String): the value of the embedded data

> **Deprecated:** The `addEmbeddedData()` method is deprecated and is unavailable on the [New Survey Taking Experience](https://www.qualtrics.com/support/survey-platform/survey-module/look-feel/simple-layout/). Use the `setJSEmbeddedData()` method instead.

---

### addOnload ( f )

**Parameters:**

- `f` (Function): the function to execute on load

---

### addOnReady ( f )

**Parameters:**

- `f` (Function): the function to execute when page is loaded and ready

---

### addOnPageSubmit ( f )

**Parameters:**

- `f` (Function): the function to execute when page is submitted. f accepts an optional type parameter that will be one of "jump", "next", or "prev" depending on how the page was submitted.

```javascript
//Sets "ED1" to "foo" when the page is submitted by advancing to the next page
Qualtrics.SurveyEngine.addOnPageSubmit(function(type)
{
	if(type == "next")
	{
		Qualtrics.SurveyEngine.setEmbeddedData("ED1", "foo");
	}
});
```

---

### addOnUnload ( f )

**Parameters:**

- `f` (Function): the function to execute when page is unloaded

---

### Qualtrics.SurveyEngine.QuestionData.getInstance(questionId string)

Accesses question information for any question on the current page.

**Parameters**:

- `questionId` (String)

**Returns**:

- Question (Object)

```javascript
Qualtrics.SurveyEngine.addOnReady(function()
{
	var q2 = Qualtrics.SurveyEngine.QuestionData.getInstance("QID2");
	q2.getQuestionContainer();
	console.log(q2.getQuestionContainer());
});
```

---

### getJSEmbeddedData(key)

Gets embedded data from the page. The `key` value will be prefixed with `__js_` when searching for the embedded data field on the page.

**Usages**

Embedded data fields on the page that are not prefixed with `__js_` will not be accessible. If you want to access a flow element embedded data field make sure the name starts with `__js_` in the embedded data block.

**Parameters**

- `key` (string)

```javascript
Qualtrics.SurveyEngine.setJSEmbeddedData('myData') // sets embedded data field '__js_myData' on the page


Qualtrics.SurveyEngine.getJSEmbeddedData('myData') // returns the embedded data field '__js_myData' that is on the page (returns 'test')
```

---

### setEmbeddedData ( key  value )

Sets embedded data to the page, or adds it if the ED key is not on the page already

**Parameters:**

- `key` (String): the embedded data key
- `value` (String): the new value of the embedded data

> **Deprecated:** The `setEmbeddedData()` method is deprecated and is unavailable on the [New Survey Taking Experience](https://www.qualtrics.com/support/survey-platform/survey-module/look-feel/simple-layout/). Use the `setJSEmbeddedData()` method instead.

---

### setJSEmbeddedData(key, value)

Sets embedded data on the page. The `key` value will be stored on the page with a prefix of `__js_`. If you want to use this embedded data field in the survey flow or in pipe text it should be referenced by the name `__js_ + key`.

**Usages**

If key = `myData`

- To use the embedded data field in piped text use `${e://Field/__js_myData}`
- To include this embedded data field in survey responses make sure your embedded data flow block includes a field by the name `__js_myData`

**Parameters**

- `key` (String)
- `value` (String)

Example:

```javascript
this.setJSEmbeddedData("myData", "test") // sets embedded data field '__js_myData' on the page
```

## Question Methods (this in addOnload callbacks)

### addOnClick ()

Adds an observer/listener to the click event on the question. Rather than calling addOnClick directly, this method will be called automatically by the addOnLoad method. You only need to assign a function to the questionclick property and the Survey Engine will take care of it for you.

```javascript
Qualtrics.SurveyEngine.addOnload(function ()
{
    this.questionclick = function(event,element){
        //for a single answer multiple choice question, the element type will be radio
        if (element.type == 'radio')
        {
            var choiceNum = element.id.split('~')[2];
            alert('You clicked on choice '+choiceNum);
        }
    }
});
```

---

### clickNextButton ()

Emulates a click on the Next Button to submit the page

```javascript
//Hides the next button and displays the question
//for 5 seconds before moving to the next page


this.hideNextButton();
var that = this;
(function(){that.clickNextButton();}).delay(5);
```

---

### clickPreviousButton ()

Emulates a click on the Previous Button to submit the page

> **Bypass buttons with `clickNextButton ()` and `clickPreviousButton ()`:** On the New Survey Taking Experience, these functions will bypass hidden and/or disabled next and previous buttons.

---

### disableNextButton ()

Sets the disabled attribute to true on the Next Button to disable it

---

### disablePreviousButton ()

Sets the disabled attribute to true on the Previous Button to disable it

---

### enableNextButton ()

Sets the disabled attribute to false on the Next Button to enable it

---

### enablePreviousButton ()

Sets the disabled attribute to false on the Previous Button to enable it.

---

### getAnswers () Array

Gets the answer ids for the question.

**Returns:** Array

---

### getChoiceAnswerValue ( choiceId  answerId  subId ) (String)

**Parameters:**

- `choiceId` (String)
- `answerId` (String)
- `subId` (String)

**Returns:** String:

- value of the choice answer

---

### getChoiceContainer ()

Gets the div of the choices

```javascript
$$('.ChoiceStructure')
```

---

### getChoiceDisplayed ( choiceId  answerId  subId ) (Boolean)

Determines if the choice is displayed or hidden

**Parameters:**

- `choiceId` (String)
- `answerId` (String)
- `subId` (String)

**Returns:** Boolean:

- true if displayed

---

### getChoiceRecodeValue ( choiceId )

Gets the choice's recode value

**Parameters:**

- `choiceId` (String)

---

### getChoices () Array

Gets the choices

**Returns:** Array:

---

### getChoicesFromRecodeValue ( recodeVal ) (Array)

Gets the choice ids that have matching recode values

**Parameters:**

- `recodeVal` (String)

**Returns:** Array:

- choice ids with matching recode value

---

### getChoicesFromVariableName ( varName ) (Array)

Gets the choice ids that have matching variable names

**Parameters:**

- `varName` (String): The variable name to search for

**Returns:** Array:

- choice ids with matching variable name

---

### getChoiceValue ( choiceId  [subId] ) (String)

Gets the actual value of a choice in the question. If a matrix-style question, also specify the subId (answerId).

**Parameters:**

- `choiceId` (String): The ID of the choice
- `[subId]` (String, optional): The ID of the Column Answer, etc.

**Returns:** (String): the value of the choice

```javascript
this.getChoiceValue(3); //returns the value of choice 3
this.getChoiceValue(3,2); //returns the value of row choice 3 answer col 2
```

---

### getChoiceVariableName ( choiceId )

Gets the choice's variable name

**Parameters:**

- `choiceId` (String)

---

### getPostTag () (String | null)

Gets the post tag from the current question's QuestionInfo object

**Returns:**

- String | null:

---

### getQuestionContainer ()

Returns the div of the question `(.QuestionOuter)`

---

### getQuestionDisplayed () (Boolean)

Determines if the question is displayed or hidden

**Returns:**

- Boolean: true if displayed

---

### getQuestionInfo () (Object | null)

Returns an object containing information about the question. See Qualtrics.SurveyEngine.QuestionInfo

**Returns:**

- Object | null: QuestionInfo

---

### getQuestionTextContainer ()

Gets the div of the question text

```javascript
$$('.QuestionText')
```

---

### getSelectedAnswers ()

Gets the selected answers

---

### getSelectedAnswerValue ( choiceId )

Gets the selected answer's value

**Parameters:**

- choiceId (Object)

---

### getSelectedChoices ()

Gets the selected choices

---

### getTextValue ( [opt_choiceId] )

Gets the value of the input text

**Parameters:**

- `[opt_choiceId]` (String, optional)

**Returns:**

- value of the current choice's input

---

### hideChoices ()

Hides the choice container

---

### hideNextButton ()

Hides the Next Button

---

### hidePreviousButton ()

Hides the Previous Button

---

### setChoiceAnswerValue ( choiceId  answerId  value )

Sets the choice answer's value

**Parameters:**

- `choiceId` (String)
- `answerId` (String)
- `value` (String)

**Returns:** -true if success, false if failure

---

### setChoiceValue ( choiceId  [subId]  value )

Sets the actual value of a choice in the question. If a matrix-style question, also specify the subId (answerId).

**Parameters:**

- `choiceId` (String): The ID of the choice being set
- `[subId]` (String, optional): The ID of the Column Answer, etc.
- `value` (String): The value being set

---

### setChoiceValueByRecodeValue ( recodeValue  [subId]  value )

Sets the value of the choice(s) specified by a recode value. Multiple choices in a question may have the same recode value. An attempt will be made to set each choice that is found. For single answer questions this may result in only the last matching choice being set.

**Parameters:**

- `recodeValue` (String): The recode value of the choice(s) being set
- `[subId]` (String, optional): The ID of the Column Answer, etc.
- `value` (String): The value being set

---

### setChoiceValueByVariableName ( variableName  [subId]  value )

Sets the value of the choice(s) specified by a variable name. Multiple choices in a question may have the same variable name. An attempt will be made to set each choice that is found. For single answer questions this may result in only the last matching choice being set.

**Parameters:**

- `variableName` (String): The variable name of the choice(s) being set
- `[subId]` (String, optional): The ID of the Column Answer, etc.
- `value` (String): The value being set

---

### showNextButton ()

Shows the Next Button

---

### showPreviousButton ()

Shows the Previous Button

## Properties

### Qualtrics.SurveyEngine.QuestionInfo

`Qualtrics.SurveyEngine.QuestionInfo` (Object): An object containing all the questions on the page. Each question is indexd by its questionID

```json
{
    QuestionID: (string) The question id
    QuestionText: (string) The question text
    QuestionType: (string) The question type code
    Choices: (object) Key is the choice id, value is information about the choice
    {
        RecodeValue: (string)
        VariableName: (string)
        Text: (string)
        Exclusive: (boolean)
    }
}
```

---

### questionclick

`questionclick` (Function)

Can be set to a callback function to perform a custom function when any element of the question is clicked. The function will be passed the following **Parameters:**

```javascript
this.questionclick = function(event,element){
    //for a single answer multiple choice question, the element type will be radio
    if (element.type == 'radio')
    {
        var choiceNum = element.id.split('~')[2];
        alert('You clicked on choice '+choiceNum);
    }
}
```

Sub-properties:

- `event` (Event): The click event
- `element` (HTMLElement): The element that was clicked

---

### questionContainer

`questionContainer` (HTMLElement) The question container

---

### questionId

`questionId` (String) The question ID

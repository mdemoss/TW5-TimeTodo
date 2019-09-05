(function(){

"use strict";

const doT = require("$:/plugins/mdemoss/TimeTodo/dep/doT.min.js");
const moment = require("$:/plugins/mdemoss/TimeTodo/dep/moment.min.js");
const timestring = require("$:/plugins/mdemoss/TimeTodo/dep/timestring.js");
var elemTemplate = doT.template($tw.wiki.getTiddler("$:/plugins/mdemoss/TimeTodo/todoList.html").fields.text);

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

if(typeof HTMLElement !== 'undefined'){ // skip this and maybe use x-tag later

class todoElem extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' }); // create a Shadow DOM

    // https://stackoverflow.com/questions/48498581/textcontent-empty-in-connectedcallback-of-a-custom-htmlelement
    // "there is no lifecycle hook that does guarantee child element access in Custom Elements spec v1"
    this.mutationObserver = new MutationObserver(() => {
      if (this.textContent) {
        this.setContent()
        this.mutationObserver.disconnect()
      }
    });
    this.mutationObserver.observe(this, {childList: true});
  }

  connectedCallback(){
    this.ourTiddlerTitle = this.parentElement.closest("div[data-tiddler-title]").getAttribute("data-tiddler-title");
    // this.intervalUpdateId = setInterval(x=>this.pollForTimeStringChange(), 5000); // every 5s is fine for normal use.
  }

  disconnectedCallback(){
    // clearInterval(this.intervalUpdateId);
  }

  setContent(){
    this.root.innerHTML = elemTemplate.call(this); /* I want to use 'this' in the template */
    this.inputElement = this.root.querySelector("input[type='text']");
    this.formElement = this.root.querySelector("form");

    formElement.addEventListener("submit", ev=> this.addItem());
  }

  addItem(ev){
    console.log("add item!");
    return;

    let oldTiddlerText = $tw.wiki.getTiddler(this.ourTiddlerTitle).fields.text;
    let oldOuterHtml = this.outerHTML;
    this.remove();
    $tw.wiki.setText(
      this.ourTiddlerTitle, "text", null,
      oldTiddlerText.replace(RegExp("(\\n[ \\t]*)?" + escapeRegExp(oldOuterHtml) + "([ \\t]*)?"), "")
    );
  }
}

customElements.define('to-do', todoElem);

} // endif HTMLElement

})();

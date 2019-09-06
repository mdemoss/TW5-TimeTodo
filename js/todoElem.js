(function(){

"use strict";

const doT = require("$:/plugins/mdemoss/TimeTodo/dep/doT.min.js");
const moment = require("$:/plugins/mdemoss/TimeTodo/dep/moment.min.js");
const timestring = require("$:/plugins/mdemoss/TimeTodo/dep/timestring.js");
var elemTemplate = doT.template($tw.wiki.getTiddler("$:/plugins/mdemoss/TimeTodo/todoElem.html").fields.text);

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// https://gist.github.com/jlbruno/1535691/db35b4f3af3dcbb42babc01541410f291a8e8fac
var getGetOrdinal = function(n) {
   var s=["th","st","nd","rd"],
       v=n%100;
   return n+(s[(v-20)%10]||s[v]||s[0]);
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
        this.setContent();
        this.checkIfNewItemParentNeedsFocus();
        this.mutationObserver.disconnect();
      }
    });
    this.mutationObserver.observe(this, {childList: true});
  }

  connectedCallback(){
    this.ourTiddlerTitle = this.parentElement.closest("div[data-tiddler-title]").getAttribute("data-tiddler-title");
    this.intervalUpdateId = setInterval(x=>this.pollForTimeStringChange(), 5000); // every 5s is fine for normal use.
  }

  disconnectedCallback(){
    clearInterval(this.intervalUpdateId);
  }

  setContent(){
    this.storedRelativeTimeString = this.relativeTimeString();
    this.root.innerHTML = elemTemplate.call(this); /* I want to use 'this' in the template */
    this.checkboxElement = this.root.querySelector("input[type='checkbox']");

    let removeButton = this.root.querySelector("button.checklist-remove");
    let listLabel = this.root.querySelector(".line-item > label");
    let dataDone = this.getAttribute("done");

    this.checkboxElement.addEventListener('input', ev=> this.updateDoneStatus() );

    removeButton.addEventListener("click", ev=> this.removeItem());
    /* hover style */ {
      let lineItemDiv = this.root.querySelector("div.line-item");
      removeButton.addEventListener("mouseenter", ev=> lineItemDiv.classList.add("js-hover-remove") );
      removeButton.addEventListener("mouseleave", ev=> lineItemDiv.classList.remove("js-hover-remove"));
    }
  }

  checkIfNewItemParentNeedsFocus(){
    // When adding new entries, the old elements are gone.
    // To "keep" focus, check to see if this was just added.
    if (
      moment(this.getAttribute("added")).isSameOrAfter(moment().subtract(1, 's')) &&
      this.parentElement.nodeName == 'TO-DO-LIST'
    ){
      this.parentElement.focus();
    }
  }

  updateDoneStatus(ev){
    let oldTiddlerText = $tw.wiki.getTiddler(this.ourTiddlerTitle).fields.text;
    let oldOuterHtml = this.outerHTML;

    if( this.checkboxElement.checked ){
    	this.setAttribute("done", (moment().toISOString()));
      this.setAttribute("times-done", (Number(this.getAttribute("times-done")) + 1 || 1));
    } else {
    	this.setAttribute("done", '');
    }

    $tw.wiki.setText(
      this.ourTiddlerTitle, "text", null,
      oldTiddlerText.replace(oldOuterHtml, this.outerHTML)
    );
  }

  removeItem(ev){
    let oldTiddlerText = $tw.wiki.getTiddler(this.ourTiddlerTitle).fields.text;
    let oldOuterHtml = this.outerHTML;
    this.remove();
    $tw.wiki.setText(
      this.ourTiddlerTitle, "text", null,
      oldTiddlerText.replace(RegExp("(\\n[ \\t]*)?" + escapeRegExp(oldOuterHtml) + "([ \\t]*)?"), "")
    );
  }

  isDone(){
    if( !this.getAttribute('recur') && this.getAttribute('done') ){
      return true;
    } else if( !this.getAttribute('done') ) {
      return false;
    }

    let whenDone = moment(this.getAttribute('done'));
    let period = moment.duration( timestring(this.getAttribute('recur'), 'ms') );
    let nextDue = whenDone + period;
    let rightNow = moment()

    if( rightNow.isBefore(nextDue) ){
      return true;
    } else {
      return false;
    }
  }

  relativeTimeString(){
    {
      let timesDone = Number(this.getAttribute("times-done")) || 0;
      let timesDoneHtml = `<span class="timesDone">${timesDone > 0 ? getGetOrdinal(timesDone) + ' time' : ''}</span>`;
      let whenDone = moment(this.getAttribute('done'));

      if( !this.getAttribute('recur') && this.getAttribute('done') ){
        return `done ${timesDone > 1 ? timesDoneHtml : ''} ${moment().to(whenDone)}`;
      } else if( !this.getAttribute('done') ) {
        return '';
      }

      let period = moment.duration( timestring(this.getAttribute('recur'), 'ms') );
      let nextDue = whenDone + period;
      let rightNow = moment()

      if( rightNow.isBefore(nextDue) ){
        return `done ${timesDoneHtml} ${moment(whenDone).fromNow()}, again ${moment(nextDue).fromNow()}`;
      } else {
        return `last done ${timesDoneHtml} ${moment().to(whenDone)}`;
      }
    }
  }

  humanRecurString() {
    if( !this.getAttribute('recur') ){
      return '';
    } else {
      try{
        timestring(this.getAttribute('recur'));
      }
      catch(e){
        return 'err!';
      }
      return 'every ' + this.getAttribute('recur');
    }
  }

  pollForTimeStringChange(){
    if( this.storedRelativeTimeString !== this.relativeTimeString() ){
      this.setContent();
    }
  }

  twColor(colorName){
    return $tw.wiki.extractTiddlerDataItem(
      $tw.wiki.getTiddlerText("$:/palette","$:/palettes/Vanilla"),
      colorName
    );
  }
}

customElements.define('to-do', todoElem);

} // endif HTMLElement

})();

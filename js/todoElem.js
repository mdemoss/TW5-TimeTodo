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
    this.expired = false;

    // https://stackoverflow.com/questions/48498581/textcontent-empty-in-connectedcallback-of-a-custom-htmlelement
    // "there is no lifecycle hook that does guarantee child element access in Custom Elements spec v1"
    this.mutationObserver = new MutationObserver(() => {
      if (this.textContent) {
        this.setContent();
        this.hideIfExpiredByParentList();
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
      this.parentElement.nodeName == 'TO-DO-LIST' &&
      moment(this.getAttribute("added")).isSameOrAfter(moment().subtract(1, 's'))
    ){
      this.parentElement.focus();
    }
  }

  hideIfExpiredByParentList(){
    if(
      this.parentElement.nodeName == 'TO-DO-LIST' &&
      this.parentElement.getAttribute("expires") &&
      !this.getAttribute('recur') &&
      this.isDone()
    ){
      try{
        let expirationDuration = moment.duration( timestring(this.parentElement.getAttribute('expires'), 'ms') );
        let whenDone = moment(this.getAttribute('done'));
        let rightNow = moment();

        if(whenDone.add(expirationDuration).isBefore(rightNow)){
          this.root.querySelector("div.line-item").style.display = 'none';
          clearInterval(this.intervalUpdateId); // ok to clear twice ( https://stackoverflow.com/questions/51317692/can-i-call-clearinterval-on-the-same-id-twice )
          this.parentElement.expiredItemCount += 1;
          this.parentElement.setContent(); // TODO: improve performance. is there an idiomatic way to do this?
          this.expired = true;
          return;
        }

      } catch(e) {
        null;
      }
    }
    // this.root.querySelector("div.line-item").style.display = ''; // time does not reverse, recurring tasks do not expire
    return;
  }

  updateDoneStatus(ev){
    let oldTiddlerText = $tw.wiki.getTiddler(this.ourTiddlerTitle).fields.text;
    // Using the parent element outerHTML handles cases where different lists have identically-named items.
    // Check if the to-do item is contained in non-html markup before using the parent's outerHTML.
    let oldParentOuterHtml = (this.parentElement && oldTiddlerText.includes(this.parentElement.outerHTML) ? this.parentElement.outerHTML : null);
    let oldOuterHtml = this.outerHTML;

    if( this.checkboxElement.checked ){
    	this.setAttribute("done", (moment().toISOString()));
      this.setAttribute("times-done", (Number(this.getAttribute("times-done")) + 1 || 1));
    } else {
    	this.setAttribute("done", '');
    }

    $tw.wiki.setText(
      this.ourTiddlerTitle, "text", null,
      oldTiddlerText.replace(
        (oldParentOuterHtml ? oldParentOuterHtml : oldOuterHtml),
        (oldParentOuterHtml ? this.parentElement.outerHTML : this.outerHTML))
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
    let rightNow = moment();

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
    this.hideIfExpiredByParentList();
  }
}

customElements.define('to-do', todoElem);

} // endif HTMLElement

})();

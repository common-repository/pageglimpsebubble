//
// Preview Script for PageGlimpse service - htp://www.pageglimpse.com
// (c) Copyright RADSense Software Inc, 2005-2008
// 

var glimpseVisible = false;
var glimpseTimerID = 0;
var glimpseRetryTimerID;
var glimpseShowTimeout = 750;
var glimpseTimeoutTimerID = 0;
var glimpsePrevObj;
var glimpsePrevImg;
var glimpsePrevCapturing;
var glimpsePrevLoader;
var glimpseFrameObj;
var glimpseCurID = null;

var glimpseTempImg = null;

var glimpseRoot = 'http://images.pageglimpse.com/';
var glimpseDevKey = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

function glimpseInit(root, auto, intlinks, timeout, imgbase, _devKey) {

    if (auto == null || auto == 'undefined') auto = true;
    glimpseShowTimeout = timeout;	
	glimpseImgBase = imgbase;
	
	if (_devKey != null)
		glimpseDevKey = _devKey;

    if (document.images) {
        var glimpseAjaxLoaderImg = new Image();
        glimpseAjaxLoaderImg.src = glimpseGetImgSrc('ajax-loader.gif');

        var glimpseSpacerImg = new Image();
        glimpseSpacerImg.src = glimpseGetImgSrc('spacer.gif');
        
        var _prevImg1 = new Image();
        var _prevImg2 = new Image();
        var _prevImg3 = new Image();
        var _prevImg4 = new Image();
        if (glimpseIsLarge()) {
            _prevImg1.src = glimpseGetImgSrc('downleftlg.png');
            _prevImg2.src = glimpseGetImgSrc('downrightlg.png');
            _prevImg3.src = glimpseGetImgSrc('upleftlg.png');
            _prevImg4.src = glimpseGetImgSrc('uprightlg.png');
        }
        else {
            _prevImg1.src = glimpseGetImgSrc('downleftsm.png');
            _prevImg2.src = glimpseGetImgSrc('downrightsm.png');
            _prevImg3.src = glimpseGetImgSrc('upleftsm.png');
            _prevImg4.src = glimpseGetImgSrc('uprightsm.png');
        }
    }

    glimpseCreateContainer();

    var obj,id,url,list;    
    list = xGetElementsByTagName('a');
    for (i=0; i<list.length; i++) {
        obj = list[i];
        if (obj && obj.href) {
            url = obj.href;
            if (url.match(/^javascript:/)) continue;
            if (url.match(/^http:\/\/localhost/)) continue;
            
            if (obj.id == null || obj.id == '' || obj.id == 'undefined') {
                obj.id = 'glimpseTag' + i;    
            }
            
            if (!intlinks && root && url.indexOf(root) == 0) continue; // ignore internal
            var rel = obj.attributes['rel'];
            
            if (auto) {
                if (rel && rel.nodeValue.match(/^noglimpse/)) continue;
                
                xAddEventListener(obj, 'mouseover', glimpsePreMouseOver, false);
                xAddEventListener(obj, 'mouseout', glimpseTagMouseOut, false);
            }
            else {
                if (!rel || rel.nodeValue == '' || rel.nodeValue.match(/^noglimpse/)) continue;
                if (rel.nodeValue.match(/^glimpse/)) continue;
                xAddEventListener(obj, 'mouseover', glimpsePreMouseOver, false);
                xAddEventListener(obj, 'mouseout', glimpseTagMouseOut, false);
            }
        }
    }
}

function glimpseCreateContainer() {

    glimpsePrevObj = xCreateElement('div'); 
    glimpsePrevObj.setAttribute('id',"glimpsePrev");
    xLeft(glimpsePrevObj, -500);
    xTop(glimpsePrevObj, -500);
    glimpsePrevObj.style.position='absolute';
    xDisplay(glimpsePrevObj, 'none');

    document.body.appendChild(glimpsePrevObj);
    
    glimpseFrameObj = xCreateElement('iframe'); // create the iframe
    glimpseFrameObj.setAttribute('id', "glimpseFrame");
    glimpseFrameObj.setAttribute('scrolling', "no");
    glimpseFrameObj.setAttribute('frameborder', "0");
    glimpseFrameObj.href = glimpseSpacer();
    xLeft(glimpseFrameObj, -500);
    xTop(glimpseFrameObj, -500);
    glimpseFrameObj.style.position='absolute';
    xDisplay(glimpseFrameObj, 'none');
    
    document.body.appendChild(glimpseFrameObj);
       
    var html = '<div id="prevCapturing" style="position:absolute;text-align:center;width:' + glimpseGetBubbleWidth() + 'px;top:100px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#0f0f0f;display:none;visibility:hidden;">Capturing Now...</div>' + 
            '<img id="prev" width="'+glimpseGetBubbleWidth()+'" height="'+glimpseGetBubbleHeight()+'" src="'+glimpseSpacer()+'"/>' +
            '<img id="prevLoader" width="32" height="32" src="'+glimpseGetImgSrc('ajax-loader.gif')+'" style="position:absolute;border:0px;" />' +
            '<img id="prevImg" width="'+glimpseGetWidth()+'" height="'+glimpseGetHeight()+'" src="'+glimpseSpacer()+'" style="position:absolute;border:1px solid #999999;display:none;visibility:hidden;" />';

    xInnerHtml(glimpsePrevObj, html);    
}

function glimpsePreMouseOver(e) {
	var evt = new xEvent(e);
	if (evt == null || evt == 'undefined') return;
	var tg = evt.target;
	if (!tg.href || tg.href== '' || tg.href == 'undefined') return;
	
    glimpseTimerID = window.setTimeout("glimpseTagMouseOver('" + tg.id + "','" + tg.href + "')", glimpseShowTimeout);
}

function glimpseTagMouseOver(id,href) {
    window.clearTimeout(glimpseTimeoutTimerID);
    glimpseShow(id,href,0,0);
    glimpseShowTimeout = 100;
}

function glimpseTagMouseOut(e) {
    window.clearTimeout(glimpseTimerID);
    glimpseHide();
    if (glimpseShowTimeout == 100) {
        glimpseTimeoutTimerID = window.setTimeout("glimpseShowTimeoutReset()", 1000);
    }
}

function glimpseShowTimeoutReset() {
    glimpseShowTimeout = 750;
}

function glimpseShow(id, url, ox, oy) {
    if (document.layers && !document.getElementById) return;
    if (glimpsePrevObj) {
        var iW = glimpseGetBubbleWidth();
        var iH = glimpseGetBubbleHeight();
        glimpseVisible = true;
        
        glimpseCurID = id;
        
        glimpsePrevCapturing = xGetElementById('prevCapturing');
        glimpsePrevImg = xGetElementById('prevImg');
        glimpsePrevLoader = xGetElementById('prevLoader');
        
        glimpseHideThumb();
        
        glimpsePos(id,iW,iH,ox,oy);
        xVisibility(glimpsePrevObj, true);
        xDisplay(glimpsePrevObj, 'block');
        
        glimpsePrevImg.src = glimpseGetThumbUrl(url);        
        glimpsePrevImg.onLoad = glimpseOnLoad();
        glimpsePrevImg.onError = glimpseOnError();
    }  
}


function glimpseOnLoad(e) {
    glimpsePrevImg.onLoad = null;
    glimpsePrevImg.onError = null;
    glimpseShowThumb(glimpseCurID);
}

function glimpseOnError(e) {
    xVisibility(glimpsePrevCapturing, true);
    xDisplay(glimpsePrevCapturing, 'block');
}

function glimpseHide() {
    if (document.layers && !document.getElementById) return;

    if (glimpseVisible) {    
        if (glimpsePrevObj) {
            xVisibility(glimpsePrevObj, false);
            xDisplay(glimpsePrevObj, 'none');
            xLeft(glimpsePrevObj, -500);
            xTop(glimpsePrevObj, -500);
        }
        if (glimpseFrameObj) { 
            xVisibility(glimpsePrevObj, false);
            xDisplay(glimpseFrameObj, 'none');
            xLeft(glimpseFrameObj, -500);
            xTop(glimpseFrameObj, -500);
        }
        glimpseHideThumb();
        glimpseVisible = false;
    }
}

function glimpseShowThumb(id) {
    if (document.layers && !document.getElementById) return;
    if (glimpsePrevImg) {
        x = xPageX(id);
        y = xPageY(id);
        var gBubble = xGetElementById('prev');
        
        if (glimpseIsLarge()) { 
            xLeft(glimpsePrevImg, xLeft(gBubble) + (glimpseIsBubbleLeft(x) ? 20 : 38));
            xTop(glimpsePrevImg, xTop(gBubble) + (glimpseIsBubbleUp(y) ? 20 : 63));
        }
        else {
            xLeft(glimpsePrevImg, xLeft(gBubble) + (glimpseIsBubbleLeft(x) ? 24 : 41));
            xTop(glimpsePrevImg, xTop(gBubble) + (glimpseIsBubbleUp(y) ? 24 : 63));
        }

        xVisibility(glimpsePrevImg, true);
        xDisplay(glimpsePrevImg, 'block');
    }
}

function glimpseHideThumb() {
    if (document.layers && !document.getElementById) return;
    if (glimpsePrevImg) {
        xVisibility(glimpsePrevImg, false);
        xDisplay(glimpsePrevImg, 'none');
        xLeft(glimpsePrevImg, -500);
        xTop(glimpsePrevImg, -500);
    }
    if (glimpsePrevCapturing) {
        xVisibility(glimpsePrevCapturing, false);
        xDisplay(glimpsePrevCapturing, 'none');
    }
}

function glimpsePos(id, w, h, ox, oy) {
    if (document.layers && !glimpseVisible) return;
    
    var x,y, ow, oh;

    x = xPageX(id);
    y = xPageY(id);
    ow = xWidth(id);
    oh = xHeight(id);
    ox = (ow / 2);
    
    xZIndex(glimpseFrameObj, glimpsePrevObj.style.zIndex - 1);    
    
    var gBubble = xGetElementById('prev');
    
    xLeft(glimpsePrevObj, (glimpseIsBubbleLeft(x) ? (x - w + ox) : (x + ow - ox) ));
    xTop(glimpsePrevObj,  (glimpseIsBubbleUp(y) ? ((y - h) + oy) : (y + oh + oy) ));

    if (glimpseIsLarge()) {    
        xLeft(glimpsePrevLoader, ((xLeft(gBubble) + (glimpseIsBubbleLeft(x) ? 20 : 38) + glimpseGetBubbleWidth()) / 2) - 32);
        xTop(glimpsePrevLoader, ((xTop(gBubble) + (glimpseIsBubbleUp(y) ? 0 : 63) + glimpseGetBubbleHeight()) / 2) - 32);
    }
    else {
        xLeft(glimpsePrevLoader, ((xLeft(gBubble) + (glimpseIsBubbleLeft(x) ? 24 : 41) + glimpseGetBubbleWidth()) / 2) - 32);
        xTop(glimpsePrevLoader, ((xTop(gBubble) + (glimpseIsBubbleUp(y) ? 0 : 63) + glimpseGetBubbleHeight()) / 2) - 32);
    }
    
    if (gBubble) {
        gBubble.src = glimpseGetBubbleSrc(x,y);
    }
}

function glimpseGetBubbleSrc(x,y) {
    var s;
    s =  glimpseImgBase; //+ 'preview/';
    s += glimpseIsBubbleUp(y) ? "up" : "down";
    s += glimpseIsBubbleLeft(x) ? "left" : "right";
    s += glimpseIsLarge() ? "lg" : "sm";
    s += ".png";
    return s;
}

function glimpseIsBubbleUp(y) {
    var h = glimpseGetBubbleHeight();
    return (y - h) > xScrollTop();
}

function glimpseIsBubbleLeft(x) {
    var h = glimpseGetBubbleWidth();
    return (x - h) > xScrollLeft();
}

function glimpseIsLarge() {
    return xClientHeight() > 500;
}

function glimpseGetThumbUrl(url) {
    var s;
    s = glimpseRoot + 'v1/thumbnails?url=' + glimpseEncode(url);
    s += "&size=";
    s += glimpseIsLarge() ? "l" : "m";
	s += "&devkey="
	s += glimpseDevKey;
    return s;
}

function newGuid() {
    var g = "{";
    for(var i = 0; i < 32; i++)
    g += Math.floor(Math.random() * 0xF).toString(0xF) + (i == 8 || i == 12 || i == 16 || i == 20 ? "-" : "")
    return g + "}";
}

function glimpseSpacer() {
    return glimpseGetImgSrc('spacer.gif');
}

function glimpseEncode(s) {
    return (typeof encodeURIComponent == "undefined") ? escape(s) : encodeURIComponent(s);
}
function glimpseGetWidth() {
    return glimpseIsLarge() ? 348 : 240;
}
function glimpseGetHeight() {
    return glimpseIsLarge() ? 260 : 180;
}
function glimpseGetBubbleWidth() {
    return glimpseIsLarge() ? 406 : 306;
}
function glimpseGetBubbleHeight() {
    return glimpseIsLarge() ? 343 : 267;
}
function glimpseEnableTransparency(obj, src) {
    if (document.all && (/png/.test(src))) {
		obj.src = glimpseSpacer();
		obj.runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+src+"', sizingMethod='none')";
	}
}

function glimpseGetImgSrc(s) {
    return glimpseImgBase + s;
}

/* Compiled from X 4.06 with XC 1.0 on 20Nov06 */
// xAddEventListener, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xAddEventListener(e,eT,eL,cap)
{
  if(!(e=xGetElementById(e))) return;
  eT=eT.toLowerCase();
  if (e==window && !e.opera && !document.all) { // simulate resize and scroll events for all except Opera and IE // this is not a good sniff but I want to remove the sims before long
    if(eT=='resize') { e.xPCW=xClientWidth(); e.xPCH=xClientHeight(); e.xREL=eL; xResizeEvent(); return; }
    if(eT=='scroll') { e.xPSL=xScrollLeft(); e.xPST=xScrollTop(); e.xSEL=eL; xScrollEvent(); return; }
  }
  if(e.addEventListener) e.addEventListener(eT,eL,cap);
  else if(e.attachEvent) e.attachEvent('on'+eT,eL);
  else e['on'+eT]=eL;
}
// called only from the above
function xResizeEvent()
{
  if (window.xREL) setTimeout('xResizeEvent()', 250);
  var w=window, cw=xClientWidth(), ch=xClientHeight();
  if (w.xPCW != cw || w.xPCH != ch) { w.xPCW = cw; w.xPCH = ch; if (w.xREL) w.xREL(); }
}
function xScrollEvent()
{
  if (window.xSEL) setTimeout('xScrollEvent()', 250);
  var w=window, sl=xScrollLeft(), st=xScrollTop();
  if (w.xPSL != sl || w.xPST != st) { w.xPSL = sl; w.xPST = st; if (w.xSEL) w.xSEL(); }
}
// xClientHeight, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xClientHeight()
{
  var v=0,d=document,w=window;
  if(d.compatMode == 'CSS1Compat' && !w.opera && d.documentElement && d.documentElement.clientHeight)
    {v=d.documentElement.clientHeight;}
  else if(d.body && d.body.clientHeight)
    {v=d.body.clientHeight;}
  else if(xDef(w.innerWidth,w.innerHeight,d.width)) {
    v=w.innerHeight;
    if(d.width>w.innerWidth) v-=16;
  }
  return v;
}
// xClientWidth, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xClientWidth()
{
  var v=0,d=document,w=window;
  if(d.compatMode == 'CSS1Compat' && !w.opera && d.documentElement && d.documentElement.clientWidth)
    {v=d.documentElement.clientWidth;}
  else if(d.body && d.body.clientWidth)
    {v=d.body.clientWidth;}
  else if(xDef(w.innerWidth,w.innerHeight,d.height)) {
    v=w.innerWidth;
    if(d.height>w.innerHeight) v-=16;
  }
  return v;
}
// xCreateElement, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xCreateElement(sTag)
{
  if (document.createElement) return document.createElement(sTag);
  else return null;
}
// xDef, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xDef()
{
  for(var i=0; i<arguments.length; ++i){if(typeof(arguments[i])=='undefined') return false;}
  return true;
}
// xDisplay, Copyright 2003-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

// This was alternative 1:

function xDisplay(e,s)
{
  if ((e=xGetElementById(e)) && e.style && xDef(e.style.display)) {
    if (xStr(s)) {
      try { e.style.display = s; }
      catch (ex) { e.style.display = ''; } // Will this make IE use a default value
    }                                      // appropriate for the element?
    return e.style.display;
  }
  return null;
}
// xEvent, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xEvent(evt) // object prototype
{
  var e = evt || window.event;
  if(!e) return;
  if(e.type) this.type = e.type;
  if(e.target) this.target = e.target;
  else if(e.srcElement) this.target = e.srcElement;
  // Section B
  if (e.relatedTarget) this.relatedTarget = e.relatedTarget;
  else if (e.type == 'mouseover' && e.fromElement) this.relatedTarget = e.fromElement;
  else if (e.type == 'mouseout') this.relatedTarget = e.toElement;
  // End Section B
  if(xDef(e.pageX,e.pageY)) { this.pageX = e.pageX; this.pageY = e.pageY; }
  else if(xDef(e.clientX,e.clientY)) { this.pageX = e.clientX + xScrollLeft(); this.pageY = e.clientY + xScrollTop(); }
  // Section A
  if (xDef(e.offsetX,e.offsetY)) {
    this.offsetX = e.offsetX;
    this.offsetY = e.offsetY;
  }
  else if (xDef(e.layerX,e.layerY)) {
    this.offsetX = e.layerX;
    this.offsetY = e.layerY;
  }
  else {
    this.offsetX = this.pageX - xPageX(this.target);
    this.offsetY = this.pageY - xPageY(this.target);
  }
  // End Section A
  this.keyCode = e.keyCode || e.which || 0;
  this.shiftKey = e.shiftKey;
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
}
// xGetComputedStyle, Copyright 2002-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xGetComputedStyle(oEle, sProp, bInt)
{
  var s, p = 'undefined';
  var dv = document.defaultView;
  if(dv && dv.getComputedStyle){
    s = dv.getComputedStyle(oEle,'');
    if (s) p = s.getPropertyValue(sProp);
  }
  else if(oEle.currentStyle) {
    // convert css property name to object property name for IE
    var i, c, a = sProp.split('-');
    sProp = a[0];
    for (i=1; i<a.length; ++i) {
      c = a[i].charAt(0);
      sProp += a[i].replace(c, c.toUpperCase());
    }
    p = oEle.currentStyle[sProp];
  }
  else return null;
  return bInt ? (parseInt(p) || 0) : p;
}

// xGetElementById, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xGetElementById(e)
{
  if(typeof(e)=='string') {
    if(document.getElementById) e=document.getElementById(e);
    else if(document.all) e=document.all[e];
    else e=null;
  }
  return e;
}
// xGetElementsByTagName, Copyright 2002-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xGetElementsByTagName(t,p)
{
  var list = null;
  t = t || '*';
  p = p || document;
  if (p.getElementsByTagName) { // DOM1
    list = p.getElementsByTagName(t);
    if (t=='*' && (!list || !list.length)) list = p.all; // IE5 '*' bug
  }
  else { // IE4 object model
    if (t=='*') list = p.all;
    else if (p.all && p.all.tags) list = p.all.tags(t);
  }
  return list || new Array();
}
// xHeight, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xHeight(e,h)
{
  if(!(e=xGetElementById(e))) return 0;
  if (xNum(h)) {
    if (h<0) h = 0;
    else h=Math.round(h);
  }
  else h=-1;
  var css=xDef(e.style);
  if (e == document || e.tagName.toLowerCase() == 'html' || e.tagName.toLowerCase() == 'body') {
    h = xClientHeight();
  }
  else if(css && xDef(e.offsetHeight) && xStr(e.style.height)) {
    if(h>=0) {
      var pt=0,pb=0,bt=0,bb=0;
      if (document.compatMode=='CSS1Compat') {
        var gcs = xGetComputedStyle;
        pt=gcs(e,'padding-top',1);
        if (pt !== null) {
          pb=gcs(e,'padding-bottom',1);
          bt=gcs(e,'border-top-width',1);
          bb=gcs(e,'border-bottom-width',1);
        }
        // Should we try this as a last resort?
        // At this point getComputedStyle and currentStyle do not exist.
        else if(xDef(e.offsetHeight,e.style.height)){
          e.style.height=h+'px';
          pt=e.offsetHeight-h;
        }
      }
      h-=(pt+pb+bt+bb);
      if(isNaN(h)||h<0) return;
      else e.style.height=h+'px';
    }
    h=e.offsetHeight;
  }
  else if(css && xDef(e.style.pixelHeight)) {
    if(h>=0) e.style.pixelHeight=h;
    h=e.style.pixelHeight;
  }
  return h;
}
// xInnerHtml, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xInnerHtml(e,h)
{
  if(!(e=xGetElementById(e)) || !xStr(e.innerHTML)) return null;
  var s = e.innerHTML;
  if (xStr(h)) {e.innerHTML = h;}
  return s;
}
// xLeft, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xLeft(e, iX)
{
  if(!(e=xGetElementById(e))) return 0;
  var css=xDef(e.style);
  if (css && xStr(e.style.left)) {
    if(xNum(iX)) e.style.left=iX+'px';
    else {
      iX=parseInt(e.style.left);
      if(isNaN(iX)) iX=xGetComputedStyle(e,'left',1);
      if(isNaN(iX)) iX=0;
    }
  }
  else if(css && xDef(e.style.pixelLeft)) {
    if(xNum(iX)) e.style.pixelLeft=iX;
    else iX=e.style.pixelLeft;
  }
  return iX;
}
xLibrary={version:'4.06',license:'GNU LGPL',url:'http://cross-browser.com/'};
// xNum, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xNum()
{
  for(var i=0; i<arguments.length; ++i){if(isNaN(arguments[i]) || typeof(arguments[i])!='number') return false;}
  return true;
}
// xPageX, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xPageX(e)
{
  if (!(e=xGetElementById(e))) return 0;
  var x = 0;
  while (e) {
    if (xDef(e.offsetLeft)) x += e.offsetLeft;
    e = xDef(e.offsetParent) ? e.offsetParent : null;
  }
  return x;
}
// xPageY, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xPageY(e)
{
  if (!(e=xGetElementById(e))) return 0;
  var y = 0;
  while (e) {
    if (xDef(e.offsetTop)) y += e.offsetTop;
    e = xDef(e.offsetParent) ? e.offsetParent : null;
  }
  return y;
}
// xScrollLeft, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xScrollLeft(e, bWin)
{
  var offset=0;
  if (!xDef(e) || bWin || e == document || e.tagName.toLowerCase() == 'html' || e.tagName.toLowerCase() == 'body') {
    var w = window;
    if (bWin && e) w = e;
    if(w.document.documentElement && w.document.documentElement.scrollLeft) offset=w.document.documentElement.scrollLeft;
    else if(w.document.body && xDef(w.document.body.scrollLeft)) offset=w.document.body.scrollLeft;
  }
  else {
    e = xGetElementById(e);
    if (e && xNum(e.scrollLeft)) offset = e.scrollLeft;
  }
  return offset;
}
// xScrollTop, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xScrollTop(e, bWin)
{
  var offset=0;
  if (!xDef(e) || bWin || e == document || e.tagName.toLowerCase() == 'html' || e.tagName.toLowerCase() == 'body') {
    var w = window;
    if (bWin && e) w = e;
    if(w.document.documentElement && w.document.documentElement.scrollTop) offset=w.document.documentElement.scrollTop;
    else if(w.document.body && xDef(w.document.body.scrollTop)) offset=w.document.body.scrollTop;
  }
  else {
    e = xGetElementById(e);
    if (e && xNum(e.scrollTop)) offset = e.scrollTop;
  }
  return offset;
}
// xStr, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xStr(s)
{
  for(var i=0; i<arguments.length; ++i){if(typeof(arguments[i])!='string') return false;}
  return true;
}
// xTop, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xTop(e, iY)
{
  if(!(e=xGetElementById(e))) return 0;
  var css=xDef(e.style);
  if(css && xStr(e.style.top)) {
    if(xNum(iY)) e.style.top=iY+'px';
    else {
      iY=parseInt(e.style.top);
      if(isNaN(iY)) iY=xGetComputedStyle(e,'top',1);
      if(isNaN(iY)) iY=0;
    }
  }
  else if(css && xDef(e.style.pixelTop)) {
    if(xNum(iY)) e.style.pixelTop=iY;
    else iY=e.style.pixelTop;
  }
  return iY;
}
// xVisibility, Copyright 2003-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xVisibility(e, bShow)
{
  if(!(e=xGetElementById(e))) return null;
  if(e.style && xDef(e.style.visibility)) {
    if (xDef(bShow)) e.style.visibility = bShow ? 'visible' : 'hidden';
    return e.style.visibility;
  }
  return null;
}

function xWidth(e,w)
{
  if(!(e=xGetElementById(e))) return 0;
  if (xNum(w)) {
    if (w<0) w = 0;
    else w=Math.round(w);
  }
  else w=-1;
  var css=xDef(e.style);
  if (e == document || e.tagName.toLowerCase() == 'html' || e.tagName.toLowerCase() == 'body') {
    w = xClientWidth();
  }
  else if(css && xDef(e.offsetWidth) && xStr(e.style.width)) {
    if(w>=0) {
      var pl=0,pr=0,bl=0,br=0;
      if (document.compatMode=='CSS1Compat') {
        var gcs = xGetComputedStyle;
        pl=gcs(e,'padding-left',1);
        if (pl !== null) {
          pr=gcs(e,'padding-right',1);
          bl=gcs(e,'border-left-width',1);
          br=gcs(e,'border-right-width',1);
        }
        // Should we try this as a last resort?
        // At this point getComputedStyle and currentStyle do not exist.
        else if(xDef(e.offsetWidth,e.style.width)){
          e.style.width=w+'px';
          pl=e.offsetWidth-w;
        }
      }
      w-=(pl+pr+bl+br);
      if(isNaN(w)||w<0) return;
      else e.style.width=w+'px';
    }
    w=e.offsetWidth;
  }
  else if(css && xDef(e.style.pixelWidth)) {
    if(w>=0) e.style.pixelWidth=w;
    w=e.style.pixelWidth;
  }
  return w;
}
// xZIndex, Copyright 2001-2006 Michael Foster (Cross-Browser.com)
// Part of X, a Cross-Browser Javascript Library, Distributed under the terms of the GNU LGPL

function xZIndex(e,uZ)
{
  if(!(e=xGetElementById(e))) return 0;
  if(e.style && xDef(e.style.zIndex)) {
    if(xNum(uZ)) e.style.zIndex=uZ;
    uZ=parseInt(e.style.zIndex);
  }
  return uZ;
}

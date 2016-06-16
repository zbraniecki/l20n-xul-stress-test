#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var program = require('commander');

const geckoPath = '/home/zbraniecki/projects/mozilla/gecko-dev';

const dtdNum = 1;
const dtdEntitiesNum = 10;
const propNum = 1;
const propEntitiesNum = 10;
const l20nNum = 1;
const l20nEntitiesNum = 10;
const old = true;

function injectChunk(path, startChunk, endChunk, newChunk) {
  const val = fs.readFileSync(path).toString();

  const startPos = val.indexOf(startChunk) + startChunk.length;
  const endPos = val.indexOf(endChunk);

  const newVal = val.slice(0, startPos) + newChunk + val.slice(endPos);

  fs.writeFileSync(path, newVal);
}

function createDTDFiles() {
  for (let i = 0; i < dtdNum; i++) {
    let source = '';
    for (let j = 0; j <  dtdEntitiesNum; j++) {
      source += `<!ENTITY entity.id.${i}${j}  "Test Entity with a value. The number is ${i}.${j}">\n`;
    }
    fs.writeFileSync(`${geckoPath}/browser/locales/en-US/chrome/browser/perftest/file${i}.dtd`, source);
  }
}

function createPropertiesFiles() {
  for (let i = 0; i < propNum; i++) {
    let source = '';
    for (let j = 0; j <  propEntitiesNum; j++) {
      source += `prop.entity.id.${i}${j} = Test Entity with a value. The number is ${i}.${j}\n`;
    }
    fs.writeFileSync(`${geckoPath}/browser/locales/en-US/chrome/browser/perftest/file${i}.properties`, source);
  }
}

function createL20nFiles() {
  for (let i = 0; i < l20nNum; i++) {
    let source = '';
    for (let j = 0; j <  l20nEntitiesNum; j++) {
      source += `prop-entity-id-${i}${j} = Test Entity with a value. The number is ${i}.${j}\n`;
    }
    fs.writeFileSync(`${geckoPath}/browser/locales/en-US/chrome/browser/perftest/file${i}.ftl`, source);
  }
}

function updateJarMn() {
  const path = `${geckoPath}/browser/locales/jar.mn`;
  const startChunk = 'pageInfo.properties)';
  const endChunk = '\n    locale/browser/quitDialog.properties';

  let newChunk = '';

  for (let i = 0; i < dtdNum; i++) {
    newChunk += `\n    locale/browser/perftest/file${i}.dtd              (%chrome/browser/perftest/file${i}.dtd)`;
  }
  for (let i = 0; i < propNum; i++) {
    newChunk += `\n    locale/browser/perftest/file${i}.properties       (%chrome/browser/perftest/file${i}.properties)`;
  }
  for (let i = 0; i < l20nNum; i++) {
    newChunk += `\n    locale/browser/perftest/file${i}.ftl              (%chrome/browser/perftest/file${i}.ftl)`;
  }

  injectChunk(path, startChunk, endChunk, newChunk);
}

function updateOldBrowserXulHead() {
  const path = `${geckoPath}/browser/base/content/browser.xul`;
  const startChunk = '1.0"?>';
  const endChunk = '\n<window';

  let newChunk = '';

  newChunk += '\n\n<!DOCTYPE window [';
  for (let i = 0; i < dtdNum; i++) {
    newChunk += `\n  <!ENTITY % file${i}DTD SYSTEM "chrome://browser/locale/perftest/file${i}.dtd">`;
    newChunk += `\n  %file${i}DTD;`;
  }
  newChunk += '\n]>\n';

  injectChunk(path, startChunk, endChunk, newChunk);
}

function updateOldBrowserXulBody() {
  const path = `${geckoPath}/browser/base/content/browser.xul`;
  const startChunk = 'title="Test Window">';
  const endChunk = '\n  <script type';

  let newChunk = '';

  for (let i = 0; i < propNum; i++) {
    newChunk += `\n  <stringbundle id="bundle${i}" src="chrome://browser/locale/perftest/file${i}.properties"/>`;
  }

  for (let i = 0; i < dtdNum; i++) {
    for (let j = 0; j < dtdEntitiesNum; j++) {
      newChunk += `\n  <label>&entity.id.${i}${j};</label>`;
    }
  }

  injectChunk(path, startChunk, endChunk, newChunk);
}

function updateOldBrowserJs() {
  const path = `${geckoPath}/browser/base/content/browser.js`;
  const startChunk = 'var x = 1;';
  const endChunk = '\nvar y = 2;';

  let newChunk = '';
  
  newChunk += '\nvar str = "";';
  newChunk += `\nfor (var i = 0; i < ${propNum}; i++) {`;
  newChunk += `\n  var bundle = document.getElementById("bundle" + i);`;
  newChunk += `\n  for (var j = 0; j < ${propEntitiesNum}; j++) {`;
  newChunk += `\n    str += bundle.getString("prop.entity.id." + i + "" + j);`;
  newChunk += `\n  }`;
  newChunk += `\n}`;
  newChunk += '\ndocument.getElementById("props").innerHTML = str';

  injectChunk(path, startChunk, endChunk, newChunk);
}

function updateNewBrowserXulHead() {
  const path = `${geckoPath}/browser/base/content/browser.xul`;
  const startChunk = '1.0"?>';
  const endChunk = '\n<window';

  let newChunk = '\n<?xml-stylesheet href="chrome://browser/content/browser.css" type="text/css"?>\n';

  injectChunk(path, startChunk, endChunk, newChunk);
}

function updateNewBrowserXulBody() {
  const path = `${geckoPath}/browser/base/content/browser.xul`;
  const startChunk = 'title="Test Window">';
  const endChunk = '\n  <script type';

  let newChunk = '';

  newChunk += '\n  <script type="application/javascript" src="chrome://global/content/l20n-chrome-observer.js"/>'
  newChunk += '\n  <localization>';
  for (let i = 0; i < l20nNum; i++) {
    newChunk += `\n    <source src="chrome://browser/locale/perftest/file${i}.ftl"/>`;
  }
  newChunk += '\n  </localization>\n\n';

  for (let i = 0; i < dtdNum; i++) {
    for (let j = 0; j < dtdEntitiesNum; j++) {
      newChunk += `\n  <label data-l10n-id="entity-id-${i}${j}"></label>`;
    }
  }

  injectChunk(path, startChunk, endChunk, newChunk);
}

createDTDFiles();
createPropertiesFiles();
createL20nFiles();
updateJarMn();

if (old) {
  updateOldBrowserXulHead();
  updateOldBrowserXulBody();
  updateOldBrowserJs();
} else {
  updateNewBrowserXulHead();
  updateNewBrowserXulBody();
}


/*
Tyler Markham
2025-10-31
For Scale Wizard project, backend musical logic and tools
*/

const W = 2; // whole step/tone
const H = 1; // half step/semi-tone
const A = 3; // augmented third

const SCALE_STEPS_CHROMATIC = [H, H, H, H, H, H, H, H, H, H, H, H];
const SCALE_STEPS_MAJOR = [W, W, H, W, W, W, H];
const SCALE_STEPS_NATURAL_MINOR = [W, H, W, W, H, W, W];
const SCALE_STEPS_MINOR_BLUES = [A, W, H, H, A, W];
const SCALE_STEPS_MAJOR_BLUES = [W, H, H, A, W, A];


// notes are an integer 0-11
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteIndices = {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11};


function RollingNumber(defaultValue, maxValue){
	this.value = defaultValue;
	this.maxValue = maxValue;
	this.add = function(toAdd){
		this.value += toAdd;
		this.value %= maxValue + 1;
	}
}

function calculateInterval(base, interval){
	let note = new RollingNumber(0, 11);
	note.add(interval); // move forward [interval] notes
	note.add(base); // modify to keep position relative to [base]
	return note.value;
}

function enumerateScale(root, whichScale){
	let scaleSize = whichScale.length;
	out = [];
	let accruedInterval = 0;
	
	for(var xint = 0;xint < scaleSize;xint++){
		accruedInterval += whichScale[xint];
		out.push(calculateInterval(root, accruedInterval));
	}
	
	return out;
}

function nameScale(noteList){
	let len = noteList.length;
	let namedStr = "";
	namedStr += noteNames[noteList[len-1]]; // root note is at end, put it at front
	len--;
	
	for(var xint = 0;xint < len;xint++)
		namedStr += ", " + noteNames[noteList[xint]];
	
	console.log("Scale: " + namedStr);
}

// nameScale(enumerateScale(noteIndices['C'], SCALE_STEPS_MAJOR));










// FEATURE 2: name scales matching a list of notes
// this means checking that a set of specified notes is a subset of notes within an enumeration of a scale
// if a note in the specified set is NOT within a particular scale enumeration, it is not that scale

// return true if innerSet is a subset of outerSet, implying innserSet has no elements that are not in outerSet
function isSubset(innerSet, outerSet){
	if(innerSet.length > outerSet.length) return false;
	
	for(var xint = 0, len = innerSet.length;xint < len;xint++)
		if(outerSet.indexOf(innerSet[xint]) == -1) return false;
	
	return true;
}

function listContainingScales(noteSet){
	if(noteSet.length == 0) throw("Exception: an empty note set was passed to listContainingScales()");
	
	let matchedScales = [];
	
	// check major scales
	for(var xint = 0;xint < 12;xint++){
		if(isSubset(noteSet, enumerateScale(xint, SCALE_STEPS_MAJOR))){
			matchedScales.push(noteNames[xint] + " Major");
		}
	}
	
	// natural minor scales
	for(var xint = 0;xint < 12;xint++){
		if(isSubset(noteSet, enumerateScale(xint, SCALE_STEPS_NATURAL_MINOR))){
			matchedScales.push(noteNames[xint] + " Natural Minor");
		}
	}
	
	// minor blues scales
	for(var xint = 0;xint < 12;xint++){
		if(isSubset(noteSet, enumerateScale(xint, SCALE_STEPS_MINOR_BLUES))){
			matchedScales.push(noteNames[xint] + " Minor Blues");
		}
	}
	
	// major blues scales
	for(var xint = 0;xint < 12;xint++){
		if(isSubset(noteSet, enumerateScale(xint, SCALE_STEPS_MAJOR_BLUES))){
			matchedScales.push(noteNames[xint] + " Major Blues");
		}
	}
	
	if(matchedScales.length == 0) matchedScales.push("-- NO MATCHES --");
	
	console.log("Scale Search Report:");
	for(var xint = 0, len = matchedScales.length;xint < len;xint++)
		console.log(matchedScales[xint]);
}

function noteNameListToIndexList(names){
	let indices = [];
	for(var xint = 0, len = names.length;xint < len;xint++)
		indices.push(noteIndices[names[xint]]);
	return indices;
}

// listContainingScales(noteNameListToIndexList(['E', 'F', 'G']));

console.log("Logic loaded");
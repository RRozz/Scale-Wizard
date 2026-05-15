/*
Tyler Markham
2025-10-31
For Scale Wizard project, backend musical logic and tools
*/

const H = 1; // half step / semi-tone
const W = 2; // whole step / tone
const A = 3; // augmented second

var scales = [];
function addScale(name, steps){
	scales.push({"name":name, "steps":steps});
}

addScale("Chromatic", [H, H, H, H, H, H, H, H, H, H, H, H]);
addScale("Major", [W, W, H, W, W, W, H]);
addScale("Natural Minor", [W, H, W, W, H, W, W]);
addScale("Major Blues", [W, H, H, A, W, A]);
addScale("Minor Blues", [A, W, H, H, A, W]);
addScale("Major Pentatonic", [A, W, W, A, W]);
addScale("Minor Pentatonic", [W, W, A, A, W]);
addScale("Ionian Mode", [W, W, H, W, W, W, H]);
addScale("Dorian Mode", [W, H, W, W, W, H, W]);
addScale("Phrygian Mode", [H, W, W, W, H, W, W]);
addScale("Lydian Mode", [W, W, W, H, W, W, H]);
addScale("Mixolydian Mode", [W, H, W, W, H, W, W]);
addScale("Aeolian Mode", [W, H, W, W, H, W, W]);
addScale("Locrian Mode", [H, W, W, H, W, W, W]);


// notes are an integer 0-11
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteIndices = {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11};

// for debug access to scales by name (e.g. scalesByName['Major'].steps)
var scalesByName = [];
for(var i = 0, len = scales.length; i < len;i++)
	scalesByName[scales[i].name] = scales[i];


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

// return true if innerSet is a subset o4f outerSet, implying innserSet has no elements that are not in outerSet
function isSubset(innerSet, outerSet){
	if(innerSet.length > outerSet.length) return false;
	
	for(var xint = 0, len = innerSet.length;xint < len;xint++)
		if(outerSet.indexOf(innerSet[xint]) == -1) return false;
	
	return true;
}

function listContainingScales(noteSet){
	if(noteSet.length == 0) throw("Exception: an empty note set was passed to listContainingScales()");
	
	let matchedScales = [];
	
	for(var i = 0, len = scales.length;i < len;i++){
		for(var scaleDegree = 0;scaleDegree < 12;scaleDegree++){
			if(isSubset(noteSet, enumerateScale(scaleDegree, scales[i].steps))){
				matchedScales.push(noteNames[scaleDegree] + " " + scales[i].name);
			}
		}
	}
	
	if(matchedScales.length == 0) matchedScales.push("-- NO MATCHES --");
	
	console.log("Scale Search Report:");
	for(var xint = 0, len = matchedScales.length;xint < len;xint++)
		console.log(matchedScales[xint]);
	
	return matchedScales;
}

function noteNameListToIndexList(names){
	let indices = [];
	for(var xint = 0, len = names.length;xint < len;xint++)
		indices.push(noteIndices[names[xint]]);
	return indices;
}

// listContainingScales(noteNameListToIndexList(['E', 'F', 'G']));

console.log("Logic loaded");
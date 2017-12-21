//1. reduce vertices
//2. use blender command line to reduce faces
//3. reduce precision of vertex coordinates to reduce file size

var fs = require('fs')
var exec = require('child_process').exec
var recursive = require('recursive-readdir')
let jsonfile = require('jsonfile')
const makeIncremental = require("babylonjs-make-incremental")
var shell = require('shelljs')

var ply

//directory of marching cube plys
let plyDir = "assets/offline/plys/"

//glossary of assets
let gloss = {}

//get all ply files with their directory paths
var mcs = []
new Promise(function(resolve, reject) {
	recursive("./" + plyDir, [], function (err, files) {
		files.forEach(file => {
			if(file.indexOf(".ply") != -1){
				let fileWithPath = file.replace(/\\/g, "/")
				mcs.push(fileWithPath)
			}
		})
		console.log(mcs)
		resolve()
	})
}).then(()=>{
	reduceFiles()
})

let modeliditer = 0

function reduceFiles(){
	var promises = []

	for(var i = 0; i < mcs.length; i++){

		//intermediary to let promise use strings in mc
		var tempHolder = mcs[i]

		promises.push(new Promise(function(resolve, reject) {
			var file = tempHolder

			//get input file
			fs.readFile(file, 'utf8', function read(err, data){
				ply = data
				ply = reduceVerts(ply)
				
				//write reduced vert file
				fs.writeFile(file, ply, (err)=>{
			    	if(err) {
			    		throw err
			    	}

			    	//turn wall1.mc.ply into wall.ply so mesh names and ids
			    	//don't have the .mc extension when loaded by babylon loader
			    	fs.renameSync(file, file.replace(".mc", ""))
			    	file = file.replace(".mc", "")

			    	//command for blender face reduction script
			    	var cmd = "blender --background --python ./blendissolve.py -- " 
			    	+ file

			    	//execute blender face reduction script
					exec(cmd, function(error, stdout, stderr) {
						fs.readFile(file, 'utf8', function read(err, data){

							if (err) {
						        throw err
						    }

						    ply = data

						    //reduce precision of verts to reduce file size
						    ply = reducePrecision(ply)

						    //create babylon file
						    fs.writeFile("." + file, ply, (err)=>{
								
								//e.g. ["gear", "helmets", "pike.mc.ply"]
						    	let pathArr = file
						    	.replace(plyDir, "")
						    	.split('/')

						    	//e.g. pike
						    	let fileName = pathArr[pathArr.length - 1]
						    	.replace(".mc", "")
						    	.replace(".ply", "")

						    	//turn gear/helmets/pike.mc.ply
						    	//into
						    	//gear\\helmets\\pike
						    	let pathForPly = file
						    	.split('/')
						    	.join('\\\\')

						    	//directory to put babylon in
						    	//e.g. assets\\models\\gear\\helmets
						    	let pathForBabylon = "assets\\\\models"
						    	for(let i = 0; i < pathArr.length - 1; i ++){
						    		pathForBabylon += "\\\\" + pathArr[i]
						    	}

						    	//make directory if it doesn't exist.
						    	if(!fs.existsSync(pathForBabylon)){
									//makes every directory required
								    shell.mkdir('-p', pathForBabylon)
								}

								//cmd to convert ply to babylon
						    	var babylonCMD = 
						    	"blender --background --python ./exportbabylon.py -- " 
						    	+ file
						    	+ " " + pathForBabylon + "\\\\" + fileName + ".babylon"

						    	//e.g. assest/models/gear/helmets/pike.babylon
						    	let pathForGloss = "./" 
						    	+ pathForBabylon.replace(/\\\\/g, "/")
						    	+ "/" + fileName + ".babylon"

						    	//e.g.
						    	//{
						    	//	char
						    	//		chad
						    	//			walk
						    	//				0
						    	//				1
						    	//				...
						    	//			idle
						    	//				0
						    	//	}
						    	let hierarchyArr = pathForBabylon.split("\\\\")
						    	let hierarchy = ['modelHier']
						    	let modelUnderscore = ""
						    	//start after assets/models/
						    	for(let j = 2; j < hierarchyArr.length; j++){
						    		hierarchy.push(hierarchyArr[j])
						    		modelUnderscore += hierarchyArr[j] + "_"
						    	}
						    	hierarchy.push(fileName)
						    	modelUnderscore += fileName
						    	assignObject(gloss, hierarchy, pathForGloss)
						    	

						    	let modelid = modeliditer++
	
								//add entry for model in glossary object
						    	assignObject(gloss, ['models', fileName, "path"], pathForGloss)
						    	assignObject(gloss, ['models', fileName, "ID"], modelid)
						    	assignObject(gloss, ['models', fileName, "modelUnderscore"], modelUnderscore)

						    	//add entry for ID: model
						    	assignObject(gloss, ['modelToID', modelUnderscore], modelid)
						    	assignObject(gloss, ['IDToModel', modelid], modelUnderscore)

						    	//execute blender face reduction script
								exec(babylonCMD, function(error, stdout, stderr) {
									resolve()
								})
						    })
						})
					})
			    })
			})

		}))
	}

	Promise.all(promises).then(function(){
		console.log("all done")

		// makeIncremental(
		//     "assets/models/char",
		//     {
		//         excludedPaths: ["secondScene", "thirdScene/subScene", "thirdScene/scene01.babylon"],
		//         excludedMeshes: {
		//             "thirdScene/scene02.babylon": [/^car-/, /^box-/, /^building/]
		//         },
		//     }
		// )
		
		//output glossary json
		jsonfile.writeFile("assets/gloss.json", gloss, {spaces: 4}, function(err) {
			
		})
	})


    function reduceVerts(ply){
		ply = ply.split('\n')

		var vertsBegin;
		var facesBegin;
		var vCount;
		var fCount;

		for(var i = 0; i < ply.length; i++){
			ply[i] = ply[i].replace('\r', "")
			if(ply[i] == "end_header"){
				vertsBegin = i + 1;
			}
			if(ply[i].indexOf('element vertex') != -1){
				vCount = parseInt(ply[i].substr(ply[i].lastIndexOf(" ")))
			}
			if(ply[i].indexOf('element face') != -1){
				fCount = parseInt(ply[i].substr(ply[i].lastIndexOf(" ")))
			}
		}

		//sections of ply file
		var header = ply.slice(0, vertsBegin);
		var verts = ply.slice(vertsBegin, vertsBegin + vCount);
		var faces = ply.slice(vertsBegin + vCount, ply.length - 1)

		var returnPly = ""

		//create new set of verts that have only ones we're using.
		//adjust faces to have new indexes to match new verts
		var newVerts = [];
		var newVertsObj = {};
		var newVertsObjIter = -1;
		var facesLength = faces.length
		var newFaces = []
		for(var i = 0; i < facesLength; i++){
			var faceVerts = faces[i].split(" ").slice(1)

			//is it quad or tri
			var quad = faces[i].split(" ")[0]
			if(quad == 4)
				quad = true
			else
				quad = false

			if(!quad){
				var newFaceVerts = []

				var vert1 = verts[faceVerts[0]]
				var vert2 = verts[faceVerts[1]]
				var vert3 = verts[faceVerts[2]]

				if(!(vert1 in newVertsObj)){
					newVerts.push(vert1)
					newVertsObj[vert1] = ++newVertsObjIter
				}
				if(!(vert2 in newVertsObj)){
					newVerts.push(vert2)
					newVertsObj[vert2] = ++newVertsObjIter
				}
				if(!(vert3 in newVertsObj)){
					newVerts.push(vert3)
					newVertsObj[vert3] = ++newVertsObjIter
				}

				newFaceVerts.push(newVertsObj[vert1])
				newFaceVerts.push(newVertsObj[vert2])
				newFaceVerts.push(newVertsObj[vert3])

				var newFace = "3 " + newFaceVerts[0] + " " + newFaceVerts[1] + " " + newFaceVerts[2]
				
				newFaces.push(newFace)
			}else{
				var newFaceVerts = []

				var vert1 = verts[faceVerts[0]]
				var vert2 = verts[faceVerts[1]]
				var vert3 = verts[faceVerts[2]]
				var vert4 = verts[faceVerts[3]]

				//add verts if it wouldn't duplicate an existing vert
				//newVertsObjIter holds index of vert in vert array
				if(!(vert1 in newVertsObj)){
					newVerts.push(vert1)
					newVertsObj[vert1] = ++newVertsObjIter
				}
				if(!(vert2 in newVertsObj)){
					newVerts.push(vert2)
					newVertsObj[vert2] = ++newVertsObjIter
				}
				if(!(vert3 in newVertsObj)){
					newVerts.push(vert3)
					newVertsObj[vert3] = ++newVertsObjIter
				}
				if(!(vert4 in newVertsObj)){
					newVerts.push(vert4)
					newVertsObj[vert4] = ++newVertsObjIter
				}

				newFaceVerts.push(newVertsObj[vert1])
				newFaceVerts.push(newVertsObj[vert2])
				newFaceVerts.push(newVertsObj[vert3])
				newFaceVerts.push(newVertsObj[vert4])

				//lower right tri
				var newFace1 = "3 " + newFaceVerts[0] + " " + newFaceVerts[1] + " " + newFaceVerts[2]

				//upper left tri
				var newFace2 = "3 " + newFaceVerts[0] + " " + newFaceVerts[2] + " " + newFaceVerts[3]

				newFaces.push(newFace1)
				newFaces.push(newFace2)
			}
		}

		//recreate ply
		for(var i = 0; i < header.length; i++){
			if(header[i].indexOf("element face") != -1){
				header[i] = "element face " + newFaces.length
			}
			else if(header[i].indexOf("element vertex") != -1){
				header[i] = "element vertex " + newVerts.length
			}
			returnPly += header[i] + "\n"
		}
		for(var i = 0; i < newVerts.length; i++){
			returnPly += newVerts[i] + "\n"
		}
		for(var i = 0; i < newFaces.length; i++){
			returnPly += newFaces[i] + "\n"
		}

		return returnPly
	}

	function reducePrecision(ply){
		ply = ply.split('\n')

		var vCount;
		var fCount;

		for(var i = 0; i < ply.length; i++){
			ply[i] = ply[i].replace('\r', "")
			if(ply[i] == "end_header"){
				vertsBegin = i + 1;
			}
			if(ply[i].indexOf('element vertex') != -1){
				vCount = parseInt(ply[i].substr(ply[i].lastIndexOf(" ")))
			}
			if(ply[i].indexOf('element face') != -1){
				fCount = parseInt(ply[i].substr(ply[i].lastIndexOf(" ")))
			}
		}

		//sections of ply file
		var header = ply.slice(0, vertsBegin);
		var verts = ply.slice(vertsBegin, vertsBegin + vCount);
		var faces = ply.slice(vertsBegin + vCount, ply.length - 1)

		var returnPly = ""

		//recreate ply
		for(var i = 0; i < header.length; i++){
			if(header[i].indexOf("element face") != -1){
				header[i] = "element face " + faces.length
			}
			else if(header[i].indexOf("element vertex") != -1){
				header[i] = "element vertex " + verts.length
			}
			returnPly += header[i] + "\n"
		}
		for(var i = 0; i < verts.length; i++){
			var vArr = verts[i].split(" ");
			vArr[0] = Math.round(vArr[0] * 100) / 100
			vArr[1] = Math.round(vArr[1] * 100) / 100
			vArr[2] = Math.round(vArr[2] * 100) / 100
			
			var newV = vArr[0] + " " + vArr[1] + " " + vArr[2] + " " +
			vArr[3] + " " + vArr[4] + " " + vArr[5]

			returnPly += newV + "\n"
		}
		for(var i = 0; i < faces.length; i++){
			returnPly += faces[i] + "\n"
		}

		return returnPly
	}
}

/**
 * Shove an object into a nested object
 * 
 * @param  {[type]}
 * @param  {[type]}
 * @param  {[type]}
 * @return {[type]}
 */
function assignObject(obj, keyPath, value) {
	let lastKeyIndex = keyPath.length - 1

	for (let i = 0; i < lastKeyIndex; i++) {
		let key = keyPath[i]
		if (!(key in obj))
			obj[key] = {}
		obj = obj[key]
	}
	obj[keyPath[lastKeyIndex]] = value
}

/**
 * Shove an array into a nested object
 * 
 * @param  {[type]}
 * @param  {[type]}
 * @param  {[type]}
 * @return {[type]}
 */
function assignArray(obj, keyPath, value) {
	let lastKeyIndex = keyPath.length - 1

	for (let i = 0; i < lastKeyIndex; i++) {
		let key = keyPath[i]
		if (!(key in obj))
			obj[key] = {}

		obj = obj[key]
	}

	//make new array if it doesn't exist
	//(first addition it won't)
	if(obj[keyPath[lastKeyIndex]] === undefined)
		obj[keyPath[lastKeyIndex]] = []

	//don't add duplicates
	if(obj[keyPath[lastKeyIndex]].indexOf(value) == -1)
		obj[keyPath[lastKeyIndex]].push(value)
}
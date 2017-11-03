//1. reduce vertices
//2. use blender command line to reduce faces
//3. reduce precision of vertex coordinates to reduce file size

var fs = require('fs')
var exec = require('child_process').exec
var recursive = require('recursive-readdir')

var ply

let plyDir = "assets/plys/"
let outputDir = "/assets/models"

var mcs = [];
new Promise(function(resolve, reject) {
	recursive("./" + plyDir, [], function (err, files) {
		files.forEach(file => {
			if(file.indexOf(".ply") != -1){
				mcs.push(file.replace(/\\/g, "/").replace(plyDir, ""))
			}
		});
		console.log(mcs)
		resolve()
	})
}).then(()=>{
	reduceFiles()
})

function reduceFiles(){
	var promises = []

	for(var i = 0; i < mcs.length; i++){
		var f = plyDir + mcs[i]

		promises.push(new Promise(function(resolve, reject) {
			var fer = f

			//get input file
			fs.readFile(fer, 'utf8', function read(err, data){
				ply = data
				ply = reduceVerts(ply)
				
				//write reduced vert file
				fs.writeFile(fer.replace(".mc", ""), ply, (err)=>{
			    	if(err) throw err;

			    	var cmd = "blender --background --python ./blendissolve.py -- " 
			    	+ fer.replace(outputDir, "")

			    	console.log(cmd)

			    	//execute blender face reduction script
					exec(cmd, function(error, stdout, stderr) {
						fs.readFile(fer.replace(outputDir, ""), 'utf8', function read(err, data){
							if (err) {
						        throw err;
						    }
						    ply = data;

						    //reduce precision of verts to reduce file size
						    ply = reducePrecision(ply)

						    //write new ply file
						    fs.writeFile("." + fer.replace(outputDir, ""), ply, (err)=>{
						    	console.log(fer.replace(plyDir, "").replace(".ply", ""))
						    	var cmd2 = 
						    	"blender --background --python ./exportbabylon.py -- " 
						    	+ fer.replace(plyDir, "").replace(".ply", "")

						    	console.log(cmd2)

						    	//execute blender face reduction script
								exec(cmd2, function(error, stdout, stderr) {

								});
						    })
						})
					})
			    })
			})
		}))
	}

	Promise.all(promises).then(function(){
		console.log("all done")
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

			// console.log(newV)
			returnPly += newV + "\n"
		}
		for(var i = 0; i < faces.length; i++){
			returnPly += faces[i] + "\n"
		}

		return returnPly
	}
}
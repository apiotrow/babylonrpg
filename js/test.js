var BABYLON = require('babylonjs')

class test{
	constructor(engine, canvas, scene, tasks){
		// let model = task.loadedMeshes[0]

		this.scene = scene
		this.tasks = tasks

		let keyCodes = {
			S: 83,
			A: 65,
			W: 87,
			D: 68
		}

		scene.clearColor = new BABYLON.Color3(0, 1, 0)
		var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 20, -10), scene)
		// camera.inputs.add(new BABYLON.FreeCameraKeyboardMoveInput())
		
		// camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		// camera.orthoTop = 50;
		// camera.orthoBottom = -50;
		// camera.orthoLeft = -50;
		// camera.orthoRight = 50
		
		this.keyState = {}
		var onKeyDown = (evt)=> {
			this.keyState[evt.key] = true

	    }
	    var onKeyUp = (evt)=> {
	    	this.keyState[evt.key] = false

	    }
	    BABYLON.Tools.RegisterTopRootEvents([{
	        name: "keydown",
	        handler: onKeyDown
	    }, {
	        name: "keyup",
	        handler: onKeyUp
	    }])

		camera.inputs.attached.keyboard.keysDown.push(keyCodes.S)
		camera.inputs.attached.keyboard.keysUp.push(keyCodes.W)
		camera.inputs.attached.keyboard.keysLeft.push(keyCodes.A)
		camera.inputs.attached.keyboard.keysRight.push(keyCodes.D)

	    camera.setTarget(BABYLON.Vector3.Zero())
	    camera.attachControl(canvas, false)

	    // var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)
	    var light = new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(.8, -1, .5), scene)
	    var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-.8, -1, -.5), scene)
	    light.intensity = 2
	    light2.intensity = 1

	    // var sphere = BABYLON.Mesh.CreateCylinder("box", 4.0, 2.0, 2.0, 0, 0,
	    // 	scene, false, BABYLON.Mesh.DEFAULTSIDE)
	    // sphere.position.y = 1
	    // let vec = new BABYLON.Vector3(3, 3, 3)
	    // sphere.lookAt(vec)


	    // var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene)

		engine.runRenderLoop( ()=> {
			this.update()
		})

		window.addEventListener("resize", function () {
		    engine.resize()
		})

		// console.log(this.tasks[0].loadedMeshes[0].animations)

		// for(let i = 0; this.tasks[0].loadedMeshes.length; i++){
		// 	scene.beginAnimation(this.tasks[0].loadedMeshes[i], 0, 10, 1, 1.0)
		// }
		// console.log(scene.beginAnimation(this.tasks[0].loadedMeshes[0], 0, 10, 1, 1.0))
	}

	update(){
		this.scene.render()

		if(this.keyState['r'] == true){
			// this.tasks[0].loadedMeshes[0].rotation.y += 0.05
		}
	}
}

module.exports = test
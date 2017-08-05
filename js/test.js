var BABYLON = require('babylonjs')

class test{
	constructor(engine, canvas, scene, task){
		// let model = task.loadedMeshes[0]

		this.scene = scene

		let keyCodes = {
			S: 83,
			A: 65,
			W: 87,
			D: 68
		}

		scene.clearColor = new BABYLON.Color3(0, 1, 0)
		var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 200, -10), scene)
		// camera.inputs.add(new BABYLON.FreeCameraKeyboardMoveInput())

		camera.inputs.attached.keyboard.keysDown.push(keyCodes.S)
		camera.inputs.attached.keyboard.keysUp.push(keyCodes.W)
		camera.inputs.attached.keyboard.keysLeft.push(keyCodes.A)
		camera.inputs.attached.keyboard.keysRight.push(keyCodes.D)

	    camera.setTarget(BABYLON.Vector3.Zero())
	    camera.attachControl(canvas, false)

	    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)
	    light.intensity = 2

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
	}

	update(){
		this.scene.render()
	}
}

module.exports = test
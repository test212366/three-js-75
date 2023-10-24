import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'
 
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'

import one from './img/one.jpg'
import two from './img/one.jpg'
import three from './img/one.jpg'


export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0x000000, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.01,
			 3000
		)
 
		this.camera.position.set(0, 0, 750) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true

		this.addObjects()		 
		this.resize()
		this.render()
		this.setupResize()

 
	}

	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 853/1280
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) / this.imageAspect
		} 


		this.material.uniforms.resolution.value.x = this.width
		this.material.uniforms.resolution.value.y = this.height
		this.material.uniforms.resolution.value.z = a1
		this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}


	addObjects() {
		let that = this

		this.numParticles = 1000
		this.space = 800
		this.pointsData = []





		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				resolution: {value: new THREE.Vector4()}
			},
			vertexShader,
			fragmentShader
		})
		
		let pointsMaterial = new THREE.PointsMaterial({color: 0xffffff, size: 2})
		let lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff})




 
		this.geometry = new THREE.PlaneGeometry(1,1,1,1)
		this.plane = new THREE.Mesh(this.geometry, this.material)

		// let pointsGeometry = 
		this.positions = new Float32Array(this.numParticles * 3)
		this.linepositions = new Float32Array(this.numParticles * 3 * 10)


		for (let i = 0; i < this.numParticles; i++) {
			let x = (Math.random() -.5 ) * this.space
			let y = (Math.random() -.5 ) * this.space
			let z = (Math.random() -.5 ) * this.space

			this.positions[3 * i] = x
			this.positions[3 * i + 1] = y
			this.positions[3 * i + 2] = z

			this.pointsData.push({
				velocity: new THREE.Vector3( 2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1)
			})

		 
		}
		let pointsGeometry = new THREE.BufferGeometry()
		let lineGeometry = new THREE.BufferGeometry()

		lineGeometry.setDrawRange(0, this.connections * 2)


		pointsGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
		lineGeometry.setAttribute('position', new THREE.BufferAttribute(this.linepositions, 3))

		this.lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial)

		this.points = new THREE.Points(pointsGeometry, pointsMaterial)
 
		this.scene.add(this.points)
		this.scene.add(this.lineMesh)
 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05
		let vertexPos = 0
		this.connections = 0
		this.material.uniforms.time.value = this.time
		 
		//this.renderer.setRenderTarget(this.renderTarget)
		this.renderer.render(this.scene, this.camera)
		if(this.numParticles) {
			for (let i = 0; i < this.numParticles; i++) {
				this.positions[3 * i] += this.pointsData[i].velocity.x
				this.positions[3 * i + 1] += this.pointsData[i].velocity.y

				this.positions[3 * i + 2] += this.pointsData[i].velocity.z


				if(this.positions[3 * i] <- this.space / 2 || this.positions[3 * i] > this.space / 2) {
					this.pointsData[i].velocity.x = -this.pointsData[i].velocity.y
				}

				if(this.positions[3 * i + 1] <- this.space / 2 || this.positions[3 * i + 1] > this.space / 2) {
					this.pointsData[i].velocity.y = -this.pointsData[i].velocity.y
				}
				if(this.positions[3 * i + 1 + 2] <- this.space / 2 || this.positions[3 * i + 2] > this.space / 2) {
					this.pointsData[i].velocity.z = -this.pointsData[i].velocity.y
				}

			 
				for (let j = i + 1; j < this.numParticles; j++) {

					let dx = this.positions[i * 3] - this.positions[j * 3]
					let dy = this.positions[i * 3 + 1] - this.positions[j * 3 + 1]
					let dz = this.positions[i * 3 + 2] - this.positions[j * 3 + 2]

					let dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

					if(dist < 130) {
						this.linepositions[vertexPos++] = this.positions[i * 3]
						this.linepositions[vertexPos++] = this.positions[i * 3 + 1]
						this.linepositions[vertexPos++] = this.positions[i * 3 + 2]
	
						this.linepositions[vertexPos++] = this.positions[j * 3]
						this.linepositions[vertexPos++] = this.positions[j * 3 + 1]
						this.linepositions[vertexPos++] = this.positions[j * 3 + 2]

						this.connections++


					}


					 
				}
 

			}
			this.lineMesh.geometry.setDrawRange(0, 100 * 2)
			this.lineMesh.geometry.attributes.position.needsUpdate = true
			this.points.geometry.attributes.position.needsUpdate = true
			 
		}
 
		//this.renderer.setRenderTarget(null)
 
		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 
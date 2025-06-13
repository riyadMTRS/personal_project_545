// --- Three.js Particles Background Logic ---
function initParticlesBackground(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`ParticlesBackground: Container with ID '${containerId}' not found.`);
        return;
    }

    let scene, camera, renderer, particles;
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0, targetRotationY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const defaultParticleOptions = {
        particleCount: 2000, // Increased particle count for density
        // Consider reducing particleCount on mobile devices for better performance.
        // For example, you could detect screen width and set a lower count.
        particleSpread: 10,
        speed: 0.1,
        particleColors: ["#00E600", "#90EE90", "#1A1A1A"], // Electric green, light green, charcoal
        moveParticlesOnHover: true,
        particleHoverFactor: 0.5, // Reduced sensitivity
        alphaParticles: true, // Use alpha blending for glow
        particleBaseSize: 2, // Smaller base size for finer particles
        sizeRandomness: 1,
        cameraDistance: 20,
        disableRotation: false,
    };
    const config = { ...defaultParticleOptions, ...options };

    // GLSL Shaders adapted for Three.js ShaderMaterial
    const vertexShader = `
        attribute vec4 random;
        attribute vec3 color;

        uniform float uTime;
        uniform float uSpread;
        uniform float uBaseSize;
        uniform float uSizeRandomness;

        varying vec4 vRandom;
        varying vec3 vColor;

        void main() {
            vRandom = random;
            vColor = color;

            // Three.js provides 'position', 'modelMatrix', 'viewMatrix', 'projectionMatrix' automatically
            vec3 pos = position * uSpread;
            pos.z *= 10.0; // Extend depth

            vec4 mPos = modelMatrix * vec4(pos, 1.0);
            float t = uTime;
            // Apply subtle movement based on random attributes
            mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
            mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
            mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);

            vec4 mvPos = viewMatrix * mPos;
            // Calculate point size based on distance from camera and randomness
            gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
        }
    `;

    const fragmentShader = `
        precision highp float;

        uniform float uTime;
        uniform float uAlphaParticles;
        varying vec4 vRandom;
        varying vec3 vColor;

        void main() {
            vec2 uv = gl_PointCoord.xy; // UV coordinates within the point (0 to 1)
            float d = length(uv - vec2(0.5)); // Distance from center of the point

            if(uAlphaParticles < 0.5) {
                // If alpha is disabled, discard outside a circle
                if(d > 0.5) {
                    discard;
                }
                gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
            } else {
                // Create a soft circular glow with alpha blending
                float circle = smoothstep(0.5, 0.4, d) * 0.8; // Smooth falloff for glow
                gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
            }
        }
    `;

    function setupScene() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = config.cameraDistance;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        renderer.setClearColor(0x000000, 0); // Transparent clear color

        // Create particle geometry
        const positions = new Float32Array(config.particleCount * 3);
        const randoms = new Float32Array(config.particleCount * 4);
        const colors = new Float32Array(config.particleCount * 3);

        const hexToRgb = (hex) => {
            hex = hex.replace(/^#/, "");
            if (hex.length === 3) {
                hex = hex.split("").map((c) => c + c).join("");
            }
            const int = parseInt(hex, 16);
            const r = ((int >> 16) & 255) / 255;
            const g = ((int >> 8) & 255) / 255;
            const b = (int & 255) / 255;
            return [r, g, b];
        };

        const palette = config.particleColors.map(hexToRgb);

        for (let i = 0; i < config.particleCount; i++) {
            let x, y, z, len;
            do {
                x = Math.random() * 2 - 1;
                y = Math.random() * 2 - 1;
                z = Math.random() * 2 - 1;
                len = x * x + y * y + z * z;
            } while (len > 1 || len === 0); // Ensure points are within a sphere and not at origin
            const r = Math.cbrt(Math.random()); // Distribute points more evenly in sphere
            positions.set([x * r, y * r, z * r], i * 3);
            randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
            const col = palette[Math.floor(Math.random() * palette.length)];
            colors.set(col, i * 3);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('random', new THREE.BufferAttribute(randoms, 4));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uSpread: { value: config.particleSpread },
                uBaseSize: { value: config.particleBaseSize },
                uSizeRandomness: { value: config.sizeRandomness },
                uAlphaParticles: { value: config.alphaParticles ? 1 : 0 },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            depthTest: false,
            blending: THREE.AdditiveBlending, // For glowing effect
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);
    }

    let animationFrameId;
    let lastTime = performance.now();
    let elapsed = 0;

    function animate() {
        animationFrameId = requestAnimationFrame(animate);

        const t = performance.now();
        const delta = t - lastTime;
        lastTime = t;
        elapsed += delta * config.speed;

        particles.material.uniforms.uTime.value = elapsed * 0.001;

        if (config.moveParticlesOnHover) {
            particles.position.x += (mouseX * config.particleHoverFactor - particles.position.x) * 0.05;
            particles.position.y += (mouseY * config.particleHoverFactor - particles.position.y) * 0.05;
        } else {
            particles.position.x = 0;
            particles.position.y = 0;
        }

        if (!config.disableRotation) {
            particles.rotation.x += Math.sin(elapsed * 0.00002) * 0.0001;
            particles.rotation.y += Math.cos(elapsed * 0.00005) * 0.00015;
            particles.rotation.z += 0.00001 * config.speed; // Slower rotation
        }

        renderer.render(scene, camera);
    }

    function onWindowResize() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    function onMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / windowHalfX; // Normalized -1 to 1
        mouseY = (event.clientY - windowHalfY) / windowHalfY; // Normalized -1 to 1
    }

    function onTouchMove(event) {
        event.preventDefault(); // Prevent scrolling
        const touch = event.touches[0];
        mouseX = (touch.clientX - windowHalfX) / windowHalfX;
        mouseY = (touch.clientY - windowHalfY) / windowHalfY;
    }

    setupScene();
    animate();
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    // Cleanup function
    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', onWindowResize);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('touchmove', onTouchMove);
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
        // Dispose Three.js resources
        if (particles) {
            particles.geometry.dispose();
            particles.material.dispose();
        }
        if (renderer) {
            renderer.dispose();
        }
    };
}


// --- Three.js Hero Text Effect Logic ---
function initHeroTextEffect(containerId, textContent) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`HeroTextEffect: Container with ID '${containerId}' not found.`);
        return;
    }

    let scene, camera, renderer, quad;
    let vMouse = new THREE.Vector2();
    let vMouseDamp = new THREE.Vector2();
    let vResolution = new THREE.Vector2();
    let textTexture;
    let offscreenCanvas;

    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    // GLSL Shaders adapted for text
    const vertexShader = `
        varying vec2 v_texcoord;
        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            v_texcoord = uv;
        }
    `;

    const fragmentShader = `
        varying vec2 v_texcoord;

        uniform sampler2D u_textTexture;
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;
        uniform float u_pixelRatio;

        uniform float u_circleSize;
        uniform float u_circleEdge;

        #ifndef PI
        #define PI 3.1415926535897932384626433832795
        #endif

        vec2 coord(in vec2 p) {
            p = p / u_resolution.xy;
            if (u_resolution.x > u_resolution.y) {
                p.x *= u_resolution.x / u_resolution.y;
                p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
            } else {
                p.y *= u_resolution.y / u_resolution.x;
                p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
            }
            p -= 0.5;
            p *= vec2(-1.0, 1.0);
            return p;
        }

        float sdCircle(in vec2 st, in vec2 center) {
            return length(st - center) * 2.0;
        }
        float fill(float x, float size, float edge) {
            return 1.0 - smoothstep(size - edge, size + edge, x);
        }

        void main() {
            vec2 st = coord(gl_FragCoord.xy) + 0.5; // Normalized fragment coordinate (0 to 1)
            vec2 posMouse = coord(u_mouse * u_pixelRatio) * vec2(1., -1.) + 0.5; // Normalized mouse coordinate (0 to 1)

            vec4 textSample = texture2D(u_textTexture, v_texcoord);
            float textAlpha = textSample.a; // Use the alpha channel of the text texture

            // Calculate mouse-driven blur/glow effect
            float mouseEffect = fill(
                sdCircle(st, posMouse),
                u_circleSize,
                u_circleEdge
            );

            // Combine text alpha with mouse effect
            // Only glow where there's text, and enhance glow with mouse
            float finalAlpha = textAlpha + mouseEffect * textAlpha * 0.5; // Adjusted multiplier for subtle glow

            // Color of the glow. Electric green.
            vec3 glowColor = vec3(0.0, 0.9, 0.0); // Electric green RGB

            // Final color: blend background (black) with glow color based on finalAlpha
            vec3 finalColor = mix(vec3(0.0), glowColor, finalAlpha);

            gl_FragColor = vec4(finalColor, finalAlpha);
        }
    `;

    function drawTextToCanvas(text, canvas) {
        const ctx = canvas.getContext('2d');
        const fontSize = 60; // Adjusted font size
        const fontFamily = 'Inter';

        // Set canvas dimensions based on container size and pixel ratio
        canvas.width = container.clientWidth * pixelRatio;
        canvas.height = container.clientHeight * pixelRatio;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous content
        ctx.font = `${fontSize * pixelRatio}px ${fontFamily}`;
        ctx.fillStyle = 'white'; // Draw text in white, shader will color it green
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate position to center text vertically and horizontally
        const x = canvas.width / 2;
        const y = canvas.height / 2;

        ctx.fillText(text, x, y);

        if (textTexture) {
            textTexture.needsUpdate = true;
        } else {
            textTexture = new THREE.CanvasTexture(canvas);
            textTexture.minFilter = THREE.LinearFilter;
            textTexture.magFilter = THREE.LinearFilter;
            textTexture.wrapS = THREE.ClampToEdgeWrapping;
            textTexture.wrapT = THREE.ClampToEdgeWrapping;
        }
    }

    function setupScene() {
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera();
        camera.position.z = 1;

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setClearColor(0x000000, 0); // Transparent background
        container.appendChild(renderer.domElement);

        offscreenCanvas = document.createElement('canvas');
        drawTextToCanvas(textContent, offscreenCanvas);

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_mouse: { value: vMouseDamp },
                u_resolution: { value: vResolution },
                u_pixelRatio: { value: pixelRatio },
                u_textTexture: { value: textTexture },
                u_circleSize: { value: 0.2 }, // Base size of the mouse effect circle
                u_circleEdge: { value: 0.4 }  // Softness of the mouse effect edge
            },
            transparent: true,
            blending: THREE.AdditiveBlending // For glowing effect
        });

        const geometry = new THREE.PlaneGeometry(1, 1);
        quad = new THREE.Mesh(geometry, material);
        scene.add(quad);
    }

    let animationFrameId;
    let lastTime = performance.now();

    function animate() {
        animationFrameId = requestAnimationFrame(animate);

        const t = performance.now();
        const dt = (t - lastTime) * 0.001; // Convert to seconds
        lastTime = t;

        // Dampen mouse movement for smoother effect
        vMouseDamp.x = THREE.MathUtils.damp(vMouseDamp.x, vMouse.x, 8, dt);
        vMouseDamp.y = THREE.MathUtils.damp(vMouseDamp.y, vMouse.y, 8, dt);

        renderer.render(scene, camera);
    }

    function onPointerMove(event) {
        const rect = container.getBoundingClientRect();
        vMouse.set(event.clientX - rect.left, event.clientY - rect.top);
    }

    function onWindowResize() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const dpr = Math.min(window.devicePixelRatio, 2);

        renderer.setSize(width, height);
        renderer.setPixelRatio(dpr);

        camera.left = -width / 2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = -height / 2;
        camera.updateProjectionMatrix();

        quad.scale.set(width, height, 1);
        vResolution.set(width, height).multiplyScalar(dpr);
        quad.material.uniforms.u_pixelRatio.value = dpr;

        // Redraw text to offscreen canvas on resize to maintain quality
        drawTextToCanvas(textContent, offscreenCanvas);
    }

    setupScene();
    animate();
    window.addEventListener('resize', onWindowResize);
    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('touchmove', onPointerMove, { passive: true }); // For touch devices

    // Initial resize call
    onWindowResize();

    // Cleanup function
    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', onWindowResize);
        container.removeEventListener('mousemove', onPointerMove);
        container.removeEventListener('touchmove', onPointerMove);
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
        if (quad) {
            quad.geometry.dispose();
            quad.material.dispose();
        }
        if (textTexture) {
            textTexture.dispose();
        }
        if (renderer) {
            renderer.dispose();
        }
    };
}

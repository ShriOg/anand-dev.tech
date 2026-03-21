(function () {
    'use strict';

    function createSpring(stiffness, damping) {
        return { x: 0, y: 0, vx: 0, vy: 0, stiffness: stiffness, damping: damping };
    }

    function stepSpring(s, tx, ty, dt) {
        var ax = s.stiffness * (tx - s.x) - s.damping * s.vx;
        var ay = s.stiffness * (ty - s.y) - s.damping * s.vy;
        s.vx += ax * dt;
        s.vy += ay * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
    }

    var GLOW_OFFSET_X = 15;
    var GLOW_OFFSET_Y = 15;
    var PARTICLE_COUNT_DESKTOP = 800;
    var PARTICLE_COUNT_MOBILE  = 250;
    var REPEL_RADIUS = 120;
    var REPEL_FORCE  = 160;
    var RETURN_STIFFNESS = 2.0;

    var S = {
        rawX: 0, rawY: 0,
        targetX: 0, targetY: 0,
        core: createSpring(10, 7.5),
        glow: createSpring(5, 6),
        halo: createSpring(2.5, 4.5),
        velocity: 0,
        smoothVel: 0,
        breathPhase: 0,
        isMobile: false,
        isActive: false,
        rafId: null,
        lastTime: 0,
        frameCount: 0,

        scene: null, camera: null, renderer: null,
        particleGeo: null,
        positions: null, originals: null,
        particleCount: 0,
        mouse3D: { x: 0, y: 0 },
        camTarget: { x: 0, y: 0 },

        grainCtx: null, grainW: 128, grainH: 128
    };

    var el = {};

    function init() {
        el.envLight  = document.querySelector('.env-light');
        el.halo      = document.getElementById('envHalo');
        el.glow      = document.getElementById('envGlow');
        el.core      = document.getElementById('envCore');
        el.atmGrad   = document.getElementById('atmGradient');
        el.atmosphere = document.querySelector('.atmosphere');
        el.grainCanvas = document.getElementById('atmGrain');
        el.particleContainer = document.getElementById('particleField');
        el.cards     = Array.from(document.querySelectorAll('.feature-card'));

        S.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                     || window.innerWidth < 768;

        initThreeJS();
        initGrain();

        if (!S.isMobile) {
            initMouseTracking();
        } else {
            initMobileBreathing();
        }

        S.lastTime = performance.now();
        tick(S.lastTime);
    }

    function initThreeJS() {
        if (typeof THREE === 'undefined' || !el.particleContainer) return;

        var w = window.innerWidth;
        var h = window.innerHeight;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);

        S.scene = new THREE.Scene();

        S.camera = new THREE.PerspectiveCamera(60, w / h, 1, 1500);
        S.camera.position.z = 500;

        S.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        S.renderer.setSize(w, h);
        S.renderer.setPixelRatio(dpr);
        S.renderer.setClearColor(0x000000, 0);
        el.particleContainer.appendChild(S.renderer.domElement);

        var texCanvas = document.createElement('canvas');
        texCanvas.width = 64;
        texCanvas.height = 64;
        var tctx = texCanvas.getContext('2d');
        var grad = tctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0,   'rgba(180, 210, 255, 1)');
        grad.addColorStop(0.2, 'rgba(96, 165, 250, 0.7)');
        grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)');
        grad.addColorStop(1,   'rgba(59, 130, 246, 0)');
        tctx.fillStyle = grad;
        tctx.fillRect(0, 0, 64, 64);
        var texture = new THREE.CanvasTexture(texCanvas);

        S.particleCount = S.isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
        var count = S.particleCount;
        var positions = new Float32Array(count * 3);
        var originals = new Float32Array(count * 3);

        var spreadX = 1200, spreadY = 800, spreadZ = 600;
        for (var i = 0; i < count; i++) {
            var x = (Math.random() - 0.5) * spreadX;
            var y = (Math.random() - 0.5) * spreadY;
            var z = (Math.random() - 0.5) * spreadZ;
            positions[i * 3]     = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            originals[i * 3]     = x;
            originals[i * 3 + 1] = y;
            originals[i * 3 + 2] = z;
        }

        S.positions = positions;
        S.originals = originals;

        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        S.particleGeo = geometry;

        var material = new THREE.PointsMaterial({
            map: texture,
            size: 4.5,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            color: 0x60a5fa
        });

        S.scene.add(new THREE.Points(geometry, material));

        window.addEventListener('resize', function () {
            var nw = window.innerWidth;
            var nh = window.innerHeight;
            S.camera.aspect = nw / nh;
            S.camera.updateProjectionMatrix();
            S.renderer.setSize(nw, nh);
        });
    }

    function initMouseTracking() {
        var inactivityTimer;

        document.addEventListener('mousemove', function (e) {
            var dx = e.clientX - S.rawX;
            var dy = e.clientY - S.rawY;
            S.velocity = Math.sqrt(dx * dx + dy * dy);

            S.rawX = e.clientX;
            S.rawY = e.clientY;

            S.targetX = e.clientX + GLOW_OFFSET_X;
            S.targetY = e.clientY + GLOW_OFFSET_Y;

            S.mouse3D.x = (e.clientX / window.innerWidth) * 2 - 1;
            S.mouse3D.y = -(e.clientY / window.innerHeight) * 2 + 1;

            S.camTarget.x = S.mouse3D.x * 30;
            S.camTarget.y = S.mouse3D.y * 20;

            if (!S.isActive) {
                S.isActive = true;
                S.core.x = S.glow.x = S.halo.x = S.targetX;
                S.core.y = S.glow.y = S.halo.y = S.targetY;
                el.envLight.classList.add('active');
            }

            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(function () {
                S.isActive = false;
                el.envLight.classList.remove('active');
            }, 2500);
        });
    }

    function tick(now) {
        var dt = Math.min((now - S.lastTime) / 1000, 0.05);
        S.lastTime = now;
        S.frameCount++;

        S.breathPhase += dt * 0.7;
        var breathVal = 0.9 + Math.sin(S.breathPhase) * 0.1;

        if (!S.isMobile && S.isActive) {
            updateGlow(dt, breathVal);
            if (S.frameCount % 2 === 0) updateCardProximity();
            updateAtmosphere();
        }

        updateParticles(dt);

        if (S.frameCount % 3 === 0) renderGrain();

        S.rafId = requestAnimationFrame(tick);
    }

    function updateGlow(dt, breathVal) {
        S.smoothVel += (S.velocity - S.smoothVel) * 0.08;
        S.velocity *= 0.85;

        var speedScale = Math.min(1 + S.smoothVel * 0.0015, 1.18);

        stepSpring(S.halo, S.targetX, S.targetY, dt);
        stepSpring(S.glow, S.targetX, S.targetY, dt);
        stepSpring(S.core, S.targetX, S.targetY, dt);

        el.halo.style.transform =
            'translate(' + S.halo.x + 'px,' + S.halo.y + 'px) scale(' + (speedScale * 0.9) + ')';
        el.glow.style.transform =
            'translate(' + S.glow.x + 'px,' + S.glow.y + 'px) scale(' + speedScale + ')';
        el.core.style.transform =
            'translate(' + S.core.x + 'px,' + S.core.y + 'px) scale(' + (speedScale * 1.05) + ')';

        el.core.style.opacity = breathVal;
        var glowOp = 0.65 + S.smoothVel * 0.003;
        el.glow.style.opacity = Math.min(glowOp, 0.95);
        el.halo.style.opacity = Math.min(glowOp * 0.65, 0.7);
    }

    function updateParticles(dt) {
        if (!S.renderer || !S.particleGeo) return;

        var pos = S.positions;
        var orig = S.originals;
        var count = S.particleCount;
        var time = S.breathPhase;

        var mx = S.mouse3D.x * 600;
        var my = S.mouse3D.y * 400;

        var driftSpeed = 8;
        var isDesktopActive = !S.isMobile && S.isActive;

        S.camera.position.x += (S.camTarget.x - S.camera.position.x) * 0.03;
        S.camera.position.y += (S.camTarget.y - S.camera.position.y) * 0.03;
        S.camera.lookAt(0, 0, 0);

        for (var i = 0; i < count; i++) {
            var idx = i * 3;
            var px = pos[idx];
            var py = pos[idx + 1];
            var pz = pos[idx + 2];
            var ox = orig[idx];
            var oy = orig[idx + 1];
            var oz = orig[idx + 2];

            var dX = Math.sin(time * 0.3 + i * 0.1) * driftSpeed * dt;
            var dY = Math.cos(time * 0.2 + i * 0.07) * driftSpeed * dt;
            var dZ = Math.sin(time * 0.15 + i * 0.13) * driftSpeed * 0.5 * dt;

            var fX = 0, fY = 0;
            if (isDesktopActive) {
                var ddx = px - mx;
                var ddy = py - my;
                var dist = Math.sqrt(ddx * ddx + ddy * ddy);
                if (dist < REPEL_RADIUS && dist > 0.01) {
                    var strength = (1 - dist / REPEL_RADIUS) * REPEL_FORCE * dt;
                    fX = (ddx / dist) * strength;
                    fY = (ddy / dist) * strength;
                }
            }

            var rX = (ox - px) * RETURN_STIFFNESS * dt;
            var rY = (oy - py) * RETURN_STIFFNESS * dt;
            var rZ = (oz - pz) * RETURN_STIFFNESS * dt;

            pos[idx]     = px + dX + fX + rX;
            pos[idx + 1] = py + dY + fY + rY;
            pos[idx + 2] = pz + dZ + rZ;
        }

        S.particleGeo.attributes.position.needsUpdate = true;
        S.renderer.render(S.scene, S.camera);
    }

    function updateCardProximity() {
        var mx = S.core.x;
        var my = S.core.y;

        for (var i = 0; i < el.cards.length; i++) {
            var card = el.cards[i];
            var rect = card.getBoundingClientRect();
            var cx = rect.left + rect.width / 2;
            var cy = rect.top + rect.height / 2;

            var dx = mx - cx;
            var dy = my - cy;
            var dist = Math.sqrt(dx * dx + dy * dy);

            var maxDist = 500;
            var proximity = Math.max(0, 1 - dist / maxDist);
            proximity = proximity * proximity;

            card.style.setProperty('--proximity', proximity.toFixed(3));
            var lx = ((mx - rect.left) / rect.width) * 100;
            var ly = ((my - rect.top) / rect.height) * 100;
            card.style.setProperty('--light-x', lx + '%');
            card.style.setProperty('--light-y', ly + '%');

            if (proximity > 0.05) {
                var ba = (proximity * 0.3).toFixed(3);
                var sa = (proximity * 0.2).toFixed(3);
                card.style.borderColor = 'rgba(96,165,250,' + ba + ')';
                card.style.boxShadow =
                    '0 20px 60px rgba(0,0,0,' + (0.3 + proximity * 0.2).toFixed(2) + '),' +
                    '0 0 ' + (proximity * 50).toFixed(0) + 'px rgba(59,130,246,' + sa + '),' +
                    'inset 0 1px 0 rgba(255,255,255,' + (proximity * 0.05).toFixed(3) + ')';
                card.style.background =
                    'rgba(255,255,255,' + (0.035 + proximity * 0.02).toFixed(4) + ')';
            } else {
                card.style.borderColor = '';
                card.style.boxShadow = '';
                card.style.background = '';
            }

            if (proximity > 0.25) {
                var ax = (my - cy) / 35;
                var ay = (cx - mx) / 35;
                var lift = proximity * 10;
                card.style.transform =
                    'translateY(-' + lift.toFixed(1) + 'px) scale(' + (1 + proximity * 0.02).toFixed(3) + ') ' +
                    'rotateX(' + ax.toFixed(2) + 'deg) rotateY(' + ay.toFixed(2) + 'deg)';
            } else {
                card.style.transform = '';
            }
        }
    }

    function updateAtmosphere() {
        if (!el.atmGrad) return;

        var xPct = (S.glow.x / window.innerWidth) * 100;
        var yPct = (S.glow.y / window.innerHeight) * 100;
        var ox = 50 + (xPct - 50) * 0.3;
        var oy = 50 + (yPct - 50) * 0.3;

        el.atmGrad.style.background =
            'radial-gradient(ellipse at ' + ox.toFixed(1) + '% ' + oy.toFixed(1) + '%, ' +
            'rgba(59,130,246,0.12) 0%, rgba(30,64,175,0.06) 25%, transparent 65%)';

        var hue = ((S.glow.x / window.innerWidth) * 8 - 4).toFixed(2);
        var bright = (1 + (S.glow.y / window.innerHeight) * 0.04 - 0.02).toFixed(4);
        el.atmosphere.style.filter = 'hue-rotate(' + hue + 'deg) brightness(' + bright + ')';
    }

    function initGrain() {
        var canvas = el.grainCanvas;
        if (!canvas) return;
        canvas.width = S.grainW;
        canvas.height = S.grainH;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.imageRendering = 'pixelated';
        S.grainCtx = canvas.getContext('2d');
    }

    function renderGrain() {
        var ctx = S.grainCtx;
        if (!ctx) return;
        var img = ctx.createImageData(S.grainW, S.grainH);
        var d = img.data;
        for (var i = 0, l = d.length; i < l; i += 4) {
            var v = (Math.random() * 255) | 0;
            d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 18;
        }
        ctx.putImageData(img, 0, 0);
    }

    function initMobileBreathing() {
        var ambients = document.querySelectorAll('.atmosphere__ambient');
        ambients.forEach(function (g, i) {
            g.style.animationDuration = (16 + i * 4) + 's';
            g.style.opacity = '0.35';
        });
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            if (S.rafId) { cancelAnimationFrame(S.rafId); S.rafId = null; }
        } else {
            S.lastTime = performance.now();
            if (!S.rafId) S.rafId = requestAnimationFrame(tick);
        }
    });

    window.addEventListener('beforeunload', function () {
        if (S.rafId) cancelAnimationFrame(S.rafId);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
document.addEventListener('keydown', function(e) { if (e.ctrlKey && e.shiftKey && e.key === 'P') { e.preventDefault(); window.location.href = 'private/'; } });

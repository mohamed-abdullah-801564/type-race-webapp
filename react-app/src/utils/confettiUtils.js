
export const launchConfetti = (rarity) => {
    if (rarity === 'common') return;

    try {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        const particleCount = rarity === 'legendary' ? 150 : 80;
        const duration = rarity === 'legendary' ? 5000 : 3000;
        const colors = rarity === 'legendary' 
            ? ['#fbbf24', '#00f5d4', '#a855f7', '#ffffff', '#f59e0b'] 
            : ['#00f5d4', '#a855f7', '#ffffff'];

        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * -100 - 20,
                size: rarity === 'legendary' ? Math.random() * 6 + 4 : Math.random() * 4 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: Math.random() * 6 - 3,
                speedY: Math.random() * 4 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 6 - 3,
                opacity: 1
            });
        }

        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) {
                window.removeEventListener('resize', handleResize);
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
                return;
            }

            ctx.clearRect(0, 0, width, height);

            // Fade out near the end
            const remainingTime = duration - elapsed;
            const fadeThreshold = 1000;
            const globalOpacity = remainingTime < fadeThreshold ? remainingTime / fadeThreshold : 1;

            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                p.rotation += p.rotationSpeed;
                p.speedY += 0.1; // gravity

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.globalAlpha = p.opacity * globalOpacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });

            requestAnimationFrame(animate);
        };

        animate();
    } catch {
        // Fail silently
    }
};

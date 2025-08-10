const canvas = document.getElementById("snow");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const snowflakes = [];
const snowflakeImage = new Image();
snowflakeImage.src = "https://icon2.cleanpng.com/20180621/hqt/kisspng-granville-island-digital-marketing-vancouver-whist-gelo-5b2bfe38d943d6.8762311515296097848899.jpg";

function createSnowflake() {
    const x = Math.random() * canvas.width;
    const y = 0;
    const size = Math.random() * 20 + 10;
    const speed = Math.random() * 1 + 0.5;
    const opacity = 1;
    snowflakes.push({ x, y, size, speed, opacity });
}

function drawSnowflakes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snowflakes.forEach((flake, index) => {
        ctx.globalAlpha = flake.opacity;
        ctx.drawImage(snowflakeImage, flake.x, flake.y, flake.size, flake.size);
        flake.y += flake.speed;
        flake.opacity -= 0.002;
        if (flake.y > canvas.height || flake.opacity <= 0) {
            snowflakes.splice(index, 1);
        }
    });
    ctx.globalAlpha = 1;
}

function update() {
    if (Math.random() < 0.05) createSnowflake();
    drawSnowflakes();
    requestAnimationFrame(update);
}

update();
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

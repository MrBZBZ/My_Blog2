(function() {
    var captchaVerified = false; // 验证状态
    var focusInterval; // 定时器句柄
    var captchaOverlayExists = false; // 验证码覆盖层是否存在

    // 验证回调
    window.callback = function(res) {
        console.log('Callback called with:', res); // 确认 res 参数
        if (res.ret === 0) {
            // 验证成功
            captchaVerified = true; // 设置验证状态为成功
            removeCaptchaContainer(); // 移除验证码覆盖层
            document.getElementById('veditor').disabled = false; // 允许输入评论
            setupIntercept(); // 启动拦截
        } else if (res.ret === 2) {
            // 验证失败
            var iframe = document.getElementById('captchaIframe');
            if (iframe) {
                iframe.contentWindow.postMessage({ type: 'updateCaptcha' }, '*');
            }
        }
    }

    // 创建验证码容器
    function createCaptchaContainer() {
        var overlay = document.getElementById('captchaOverlay');
        if (overlay) {
            overlay.remove(); // 移除已有的 overlay
        }

        overlay = document.createElement('div');
        overlay.id = 'captchaOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '1000';
        document.body.appendChild(overlay);

        var iframe = document.createElement('iframe');
        iframe.id = 'captchaIframe';
        iframe.style.width = '300px';
        iframe.style.height = '200px';
        overlay.appendChild(iframe);

        // 动态生成 iframe 页面
        var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Captcha</title>
                <style>
                    body {
                        margin: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        background-color: #fff;
                    }
                    #captcha-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                    }
                    #captcha-image {
                        margin-bottom: 10px;
                        border: 1px solid #ccc;
                    }
                    #error-message {
                        color: red;
                        margin-bottom: 10px;
                        display: none;
                    }
                </style>
            </head>
            <body>
                <div id="captcha-container">
                    <canvas id="captcha-image" width="150" height="50"></canvas>
                    <div id="error-message">Captcha verification failed. Please try again.</div>
                    <input type="text" id="captcha-input" placeholder="Enter captcha">
                    <button id="verify-button">Verify</button>
                </div>
                <script>
                    function generateRandomString(length) {
                        let text = '';
                        const possible = 'abcdefghjknmopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        for (let i = 0; i < length; i++) {
                            text += possible.charAt(Math.floor(Math.random() * possible.length));
                        }
                        return text;
                    }

                    function drawCaptcha(captchaText) {
                        const canvas = document.getElementById('captcha-image');
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = "#fff";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        ctx.textBaseline = "middle";
                        ctx.font = "bold 24px Arial";
                        ctx.fillStyle = "#000";

                        // 绘制干扰线
                        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
                        for (let i = 0; i < 5; i++) {
                            ctx.beginPath();
                            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
                            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
                            ctx.stroke();
                        }

                        // 绘制验证码文本
                        ctx.fillStyle = "#000";
                        const textWidth = ctx.measureText(captchaText).width;
                        const xPosition = (canvas.width - textWidth) / 2;
                        ctx.fillText(captchaText, xPosition, canvas.height / 2);

                        // 绘制噪点
                        for (let i = 0; i < 30; i++) {
                            ctx.fillStyle = \`rgba(0, 0, 0, \${Math.random() * 0.5})\`;
                            ctx.beginPath();
                            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
                            ctx.fill();
                        }
                    }

                    function updateCaptcha() {
                        const captchaText = generateRandomString(6);
                        sessionStorage.setItem('captcha', captchaText);
                        drawCaptcha(captchaText);
                    }

                    var captchaText = generateRandomString(6);
                    sessionStorage.setItem('captcha', captchaText);
                    drawCaptcha(captchaText);

                    document.getElementById('verify-button').addEventListener('click', function() {
                        var inputText = document.getElementById('captcha-input').value;
                        var storedCaptcha = sessionStorage.getItem('captcha');
                        console.log('Verifying captcha:', inputText, storedCaptcha);
                    
                        if (inputText.toLowerCase() === storedCaptcha.toLowerCase()) {
                            console.log('Captcha verified, sending message to parent');
                            window.parent.postMessage({ type: 'captchaVerification', result: 0 }, '*'); // 验证成功
                        } else {
                            document.getElementById('error-message').style.display = 'block';
                            updateCaptcha(); // 刷新验证码
                            window.parent.postMessage({ type: 'captchaVerification', result: 2 }, '*'); // 验证失败
                        }
                    });

                    window.addEventListener('message', function(event) {
                        if (event.origin === window.location.origin && event.data.type === 'updateCaptcha') {
                            updateCaptcha();
                        }
                    });
                </script>
            </body>
            </html>
        `);
        iframeDoc.close();
    }

    function removeCaptchaContainer() {
        var overlay = document.getElementById('captchaOverlay');
        if (overlay) {
            overlay.remove(); // 移除覆盖层和 iframe
        }
    }

    function setupIntercept() {
        var originalOpen = XMLHttpRequest.prototype.open;
        var originalSend = XMLHttpRequest.prototype.send;
        console.log('1');

        XMLHttpRequest.prototype.open = function(method, url) {
            console.log('2');
            this._url = url;
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function(body) {
            console.log('3');
            var xhrInstance = this;

            if (captchaVerified) {
                console.log('4');
                originalSend.apply(this, arguments);
            } else {
                console.log('Request blocked: Captcha not verified');
                // 阻止请求发送
                return;
            }

            // 监听请求完成
            this.addEventListener('load', function() {
                console.log('Request completed, URL:', xhrInstance._url);
                if (xhrInstance._url.includes('https://leancloud.cn/1.1/classes/Comment')) {
                    // 请求完成后，重新启动定时器
                    console.log('Comment request detected');
                    captchaVerified = false; // Reset verification status
                    clearInterval(focusInterval); // 清除旧的定时器
                    setupFocusListener(); // 重新设置焦点监听器
                }
            });
        };
    }

    function setupFocusListener() {
        focusInterval = window.setInterval(function() {
            var act = document.activeElement.id;
            if (act === "veditor" && !captchaOverlayExists) {
                createCaptchaContainer(); // 创建验证码容器
                document.getElementById('veditor').disabled = true; // 禁止输入评论
                captchaOverlayExists = true; // 设置验证码覆盖层已存在
            }
        }, 1000);
    }

    setupFocusListener(); // 初始化时设置监听
})();

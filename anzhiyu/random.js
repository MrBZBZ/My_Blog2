var posts=["2024/05/02/autologin/","2024/05/01/hello-world/","2024/06/15/zongping/","2024/05/02/hwid/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };
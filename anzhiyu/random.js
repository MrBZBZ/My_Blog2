var posts=["2024/07/16/api-xiufu/","2024/05/02/autologin/","2024/05/02/hwid/","2024/08/09/twikoo/","2024/05/01/hello-world/","2024/06/25/valine/","2024/06/15/zongping/","2024/08/10/Bilibili-Video-Downloader/","2025/06/25/obf/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };
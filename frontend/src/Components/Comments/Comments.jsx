import React, { useEffect } from "react";

const Comments = () => {
  useEffect(() => {
    // Cargar el SDK de Facebook
    if (window.FB) {
      window.FB.XFBML.parse();
    } else {
      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.src = "https://connect.facebook.net/es_ES/sdk.js#xfbml=1&version=v20.0&appId=823013262921057";
      script.onload = () => {
        if (window.FB) {
          window.FB.init({
            appId: "823013262921057",
            autoLogAppEvents: true,
            xfbml: true,
            version: "v20.0"
          });
          window.FB.XFBML.parse();
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="flex justify-center">
      <div id="fb-root"></div>
      <div className="fb-comments" data-href="https://web-site-armaly.vercel.app/" data-width="" data-numposts="5" ></div>
    </div>
  );
};

export default Comments;

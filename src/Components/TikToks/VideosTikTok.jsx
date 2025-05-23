import React, { useEffect } from "react";

const VideosTikTok = () => {
  useEffect(() => {
    // Cargar el script de TikTok para que los videos se embeben correctamente
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <blockquote
        className="tiktok-embed"
        cite="https://www.tiktok.com/@martyelsinamigos/video/7447746335698078982"
        data-video-id="7447746335698078982"
        style={{ maxWidth: "605px", minWidth: "325px" }}
      >
        <section>
          <a
            target="_blank"
            title="@martyelsinamigos"
            href="https://www.tiktok.com/@martyelsinamigos?refer=embed"
            rel="noopener noreferrer"
          >
            @martyelsinamigos
          </a>{" "}
          <a
            title="fpy_tiktok_viral"
            target="_blank"
            href="https://www.tiktok.com/tag/fpy_tiktok_viral?refer=embed"
            rel="noopener noreferrer"
          >
            #fpy_tiktok_viral
          </a>{" "}
          <a
            title="fpyシ"
            target="_blank"
            href="https://www.tiktok.com/tag/fpy%E3%82%B7?refer=embed"
            rel="noopener noreferrer"
          >
            #fpyシ
          </a>{" "}
          <a
            title="videoviral"
            target="_blank"
            href="https://www.tiktok.com/tag/videoviral?refer=embed"
            rel="noopener noreferrer"
          >
            #videoviral
          </a>{" "}
          <a
            title="musically"
            target="_blank"
            href="https://www.tiktok.com/tag/musically?refer=embed"
            rel="noopener noreferrer"
          >
            #musically
          </a>{" "}
          <a
            title="reflexion"
            target="_blank"
            href="https://www.tiktok.com/tag/reflexion?refer=embed"
            rel="noopener noreferrer"
          >
            #reflexion
          </a>{" "}
          <a
            title="fyppppppppppppppppppppppp"
            target="_blank"
            href="https://www.tiktok.com/tag/fyppppppppppppppppppppppp?refer=embed"
            rel="noopener noreferrer"
          >
            #fyppppppppppppppppppppppp
          </a>{" "}
          <a
            title="musica"
            target="_blank"
            href="https://www.tiktok.com/tag/musica?refer=embed"
            rel="noopener noreferrer"
          >
            #musica
          </a>{" "}
          <a
            title="foruyoupage"
            target="_blank"
            href="https://www.tiktok.com/tag/foruyoupage?refer=embed"
            rel="noopener noreferrer"
          >
            #foruyoupage
          </a>{" "}
          <a
            target="_blank"
            title="♬ Pa Janguiar - Feid &#38; Yandel"
            href="https://www.tiktok.com/music/Pa-Janguiar-7364506427283720208?refer=embed"
            rel="noopener noreferrer"
          >
            ♬ Pa Janguiar - Feid &#38; Yandel
          </a>{" "}
        </section>
      </blockquote>
    </div>
  );
};

export default VideosTikTok;

import { ImageResponse } from "next/og";

const FONT_SOURCES = [
  {
    name: "Syne",
    url: "https://fonts.gstatic.com/s/syne/v22/8vIS7w4qzmVxsWxjBZRjr0FKM_04uQ6OQly_aA.woff",
    weight: 800,
  },
  {
    name: "Geist",
    url: "https://fonts.gstatic.com/s/geist/v1/gyBhhwUxId8gMGYQMKR3pzfaWI_RnOI.woff",
    weight: 400,
  },
] as const;

type SocialImageFontWeight = (typeof FONT_SOURCES)[number]["weight"];

type SocialImageFont = {
  name: string;
  data: ArrayBuffer;
  style: "normal";
  weight: SocialImageFontWeight;
};

async function loadFont(
  name: string,
  url: string,
  weight: SocialImageFontWeight
): Promise<SocialImageFont | null> {
  try {
    const response = await fetch(new URL(url));

    if (!response.ok) {
      console.warn(`Failed to load ${name} font for social image`, {
        status: response.status,
        url,
      });
      return null;
    }

    return {
      name,
      data: await response.arrayBuffer(),
      style: "normal",
      weight,
    };
  } catch (error) {
    console.warn(`Failed to load ${name} font for social image`, {
      error,
      url,
    });
    return null;
  }
}

async function loadFonts(): Promise<SocialImageFont[]> {
  const fonts = await Promise.all(
    FONT_SOURCES.map(({ name, url, weight }) => loadFont(name, url, weight))
  );

  return fonts.filter((font): font is SocialImageFont => font !== null);
}

export async function createSocialImageResponse() {
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#F5F5F5",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            border: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -60,
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: "1px solid rgba(0,0,0,0.04)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
            padding: "48px 64px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 88,
              height: 88,
              borderRadius: 0,
              background: "#1DC95C",
              border: "3px solid #121212",
              boxShadow: "6px 6px 0 #121212",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontFamily: "Syne",
              fontSize: 64,
              fontWeight: 800,
              color: "#121212",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            GungleClips
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Geist",
              fontSize: 26,
              color: "#78786f",
              letterSpacing: "-0.3px",
              lineHeight: 1,
            }}
          >
            Turn long videos into viral-ready shorts
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 8,
            }}
          >
            {["AI-Powered", "Auto Subtitles", "9:16 Vertical", "Open Source"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 18px",
                    borderRadius: 100,
                    background: "rgba(0,0,0,0.05)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    fontFamily: "Geist",
                    fontSize: 15,
                    color: "#4a4a46",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #3a3a38 0%, #6b6b67 50%, #3a3a38 100%)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      ...(fonts.length > 0 ? { fonts } : {}),
    }
  );
}
